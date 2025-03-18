import { writeFile } from 'fs/promises';
import type {
	IBinaryKeyData,
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { BINARY_ENCODING, NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import type { Config } from 'node-ssh';
import { NodeSSH } from 'node-ssh';
import type { Readable } from 'stream';
import { file as tmpFile } from 'tmp-promise';

// Si necesitas aún formatPrivateKey, mantenlo
import { formatPrivateKey } from '../../utils/utilities';

async function resolveHomeDir(
	this: IExecuteFunctions,
	path: string,
	ssh: NodeSSH,
	itemIndex: number,
) {
	if (path.startsWith('~/')) {
		let homeDir = (await ssh.execCommand('echo $HOME')).stdout;
		if (!homeDir.endsWith('/')) {
			homeDir += '/';
		}
		return path.replace('~/', homeDir);
	}
	if (path.startsWith('~')) {
		throw new NodeOperationError(
			this.getNode(),
			'Invalid path. Replace "~" with home directory or "~/"',
			{ itemIndex },
		);
	}
	return path;
}

export class Dynamicssh implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SSH (Dynamic)',
		name: 'dynamicssh',
		icon: 'fa:terminal',
		iconColor: 'black',
		group: ['input'],
		version: 1,
		description: 'Execute commands via SSH with dynamic credential data',
		defaults: {
			name: 'SSH (Dynamic)',
			color: '#000000',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],

		properties: [
			// 1) Conexión base
			{
				displayName: 'Host',
				name: 'host',
				type: 'string',
				default: '',
				placeholder: 'ej: 127.0.0.1',
				required: true,
			},
			{
				displayName: 'Port',
				name: 'port',
				type: 'number',
				default: 22,
				required: true,
			},
			{
				displayName: 'Username',
				name: 'username',
				type: 'string',
				default: '',
				required: true,
			},
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'Password',
						value: 'password',
					},
					{
						name: 'Private Key',
						value: 'privateKey',
					},
				],
				default: 'password',
				required: true,
			},

			// === Primer "divisor" (notice) ===
			{
				displayName: '--- Authentication Details ---',
				name: 'dividerAuth',
				type: 'notice',
				default: '',
			},

			// 2) Campos que se muestran siempre
			{
				displayName: 'Password',
				name: 'password',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				// Quitar displayOptions para que siempre se muestre
			},
			{
				displayName: 'Private Key',
				name: 'privateKey',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Passphrase',
				name: 'passphrase',
				type: 'string',
				default: '',
				typeOptions: {
					password: true,
				},
			},

			// === Segundo "divisor" (notice) ===
			{
				displayName: '--- Command/File Settings ---',
				name: 'dividerResource',
				type: 'notice',
				default: '',
			},

			// 3) Parametrización del recurso y operación
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Command',
						value: 'command',
					},
					{
						name: 'File',
						value: 'file',
					},
				],
				default: 'command',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['command'],
					},
				},
				options: [
					{
						name: 'Execute',
						value: 'execute',
						description: 'Execute a command',
						action: 'Execute a command',
					},
				],
				default: 'execute',
			},
			{
				displayName: 'Command',
				name: 'command',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['command'],
						operation: ['execute'],
					},
				},
				default: '',
				description: 'The command to be executed on a remote device',
			},
			{
				displayName: 'Working Directory',
				name: 'cwd',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['command'],
						operation: ['execute'],
					},
				},
				default: '/',
				required: true,
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['file'],
					},
				},
				options: [
					{
						name: 'Download',
						value: 'download',
						description: 'Download a file',
						action: 'Download a file',
					},
					{
						name: 'Upload',
						value: 'upload',
						description: 'Upload a file',
						action: 'Upload a file',
					},
				],
				default: 'upload',
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['upload'],
					},
				},
				placeholder: '',
				hint: 'The name of the input binary field containing the file to be uploaded',
			},
			{
				displayName: 'Target Directory',
				name: 'path',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['upload'],
					},
				},
				default: '',
				required: true,
				placeholder: '/home/user',
				description:
					'The directory to upload the file to. The file name is taken from the binary data. To override, set the parameter "File Name" under options.',
			},
			{
				displayName: 'Path',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['download'],
					},
				},
				name: 'path',
				type: 'string',
				default: '',
				placeholder: '/home/user/invoice.txt',
				description:'Full path (including file name) of the file to download.',
				required: true,
			},
			{
				displayName: 'File Property',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['download'],
					},
				},
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				description: 'Object property name which holds binary data',
				required: true,
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['upload', 'download'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'File Name',
						name: 'fileName',
						type: 'string',
						default: '',
						description: 'Overrides the binary data file name',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		console.log("items", items);
		const returnItems: INodeExecutionData[] = [];

		const ssh = new NodeSSH();

		// Leemos los datos de conexión desde el primer item (o por item, si quieres).
		const host = this.getNodeParameter('host', 0) as string;
		const port = this.getNodeParameter('port', 0) as number;
		const username = this.getNodeParameter('username', 0) as string;
		const authentication = this.getNodeParameter('authentication', 0) as string;
		const password = this.getNodeParameter('password', 0) as string;
		const privateKey = this.getNodeParameter('privateKey', 0) as string;
		const passphrase = this.getNodeParameter('passphrase', 0) as string;
		console.log("host", host);
		console.log("port", port);
		console.log("username", username);
		console.log("authentication", authentication);
		console.log("password", password);
		console.log("privateKey", privateKey);
		console.log("passphrase", passphrase);


		const sshConfig: Config = {
			host,
			port,
			username,
		};

		// Solo usamos la info que corresponda según 'authentication',
		// aunque los campos estén siempre visibles.
		if (authentication === 'password') {
			sshConfig.password = password;
		} else {
			if (privateKey) {
				sshConfig.privateKey = formatPrivateKey(privateKey);
			}
			if (passphrase) {
				sshConfig.passphrase = passphrase;
			}
		}

		await ssh.connect(sshConfig);

		try {
			for (let i = 0; i < items.length; i++) {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				try {
					if (resource === 'command') {
						if (operation === 'execute') {
							const command = this.getNodeParameter('command', i) as string;
							const rawCwd = this.getNodeParameter('cwd', i) as string;
							const cwd = await resolveHomeDir.call(this, rawCwd, ssh, i);

							const result = await ssh.execCommand(command, { cwd });
							returnItems.push({
								json: result as unknown as IDataObject,
								pairedItem: { item: i },
							});
						}
					} else if (resource === 'file') {
						if (operation === 'download') {
							const dataPropertyNameDownload = this.getNodeParameter('binaryPropertyName', i);
							const parameterPath = await resolveHomeDir.call(
								this,
								this.getNodeParameter('path', i) as string,
								ssh,
								i
							);

							const binaryFile = await tmpFile({ prefix: 'n8n-ssh-' });
							try {
								await ssh.getFile(binaryFile.path, parameterPath);

								// Creamos un objeto binario nuevo
								const newBinaryData: IBinaryKeyData = {};

								// Solo hacemos el assign si items[i].binary existe
								if (items[i].binary) {
									Object.assign(newBinaryData, items[i].binary as IBinaryKeyData);
								}

								const fileName = this.getNodeParameter('options.fileName', i, '') as string;

								// Guardamos la info del archivo descargado en la key deseada
								newBinaryData[dataPropertyNameDownload] =
									await this.nodeHelpers.copyBinaryFile(
										binaryFile.path,
										fileName || parameterPath,
									);

								const newItem: INodeExecutionData = {
									json: items[i].json,
									binary: newBinaryData,
									pairedItem: { item: i },
								};

								returnItems.push(newItem);
							} finally {
								await binaryFile.cleanup();
							}

						} else if (operation === 'upload') {
							const parameterPath = await resolveHomeDir.call(
								this,
								this.getNodeParameter('path', i) as string,
								ssh,
								i
							);
							const fileName = this.getNodeParameter('options.fileName', i, '') as string;
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
							const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);

							let uploadData: Buffer | Readable;
							if (binaryData.id) {
								uploadData = await this.helpers.getBinaryStream(binaryData.id);
							} else {
								uploadData = Buffer.from(binaryData.data, BINARY_ENCODING);
							}

							const binaryFile = await tmpFile({ prefix: 'n8n-ssh-' });
							try {
								await writeFile(binaryFile.path, uploadData);
								await ssh.putFile(
									binaryFile.path,
									`${parameterPath}${
										parameterPath.endsWith('/') ? '' : '/'
									}${fileName || binaryData.fileName}`,
								);

								returnItems.push({
									json: { success: true },
									pairedItem: { item: i },
								});
							} finally {
								await binaryFile.cleanup();
							}
						}
					}
				} catch (error) {
					if (this.continueOnFail()) {
						returnItems.push({
							json: { error: (error as Error).message },
							pairedItem: { item: i },
						});
						continue;
					}
					throw error;
				}
			}
		} finally {
			ssh.dispose();
		}

		return [returnItems];
	}
}
