import { randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import { promisify } from 'util';

// Promisify qrcode-terminal.generate
const generateTerminalQR = promisify((text: string, opts: any, cb: (error: Error | null, result: string) => void) => {
  qrcodeTerminal.generate(text, opts, (result: string) => cb(null, result));
});

export const generatorTools = {
  generateUUID: {
    name: 'generateUUID',
    description: 'Generate a random UUID using crypto.randomUUID()',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return {
        content: [{
          type: 'text',
          text: randomUUID()
        }]
      };
    }
  },

  generateQRCode: {
    name: 'generateQRCode',
    description: 'Generate a QR code from input data',
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          description: 'Data to encode in QR code'
        },
        type: {
          type: 'string',
          description: 'Output type (terminal, svg, or base64)',
          enum: ['terminal', 'svg', 'base64'],
          default: 'terminal'
        },
        errorCorrectionLevel: {
          type: 'string',
          description: 'Error correction level',
          enum: ['L', 'M', 'Q', 'H'],
          default: 'M'
        }
      },
      required: ['data']
    },
    handler: async ({
      data,
      type = 'terminal',
      errorCorrectionLevel = 'M'
    }: {
      data: string;
      type?: 'terminal' | 'svg' | 'base64';
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    }) => {
      try {
        let result: string;
        const options = {
          errorCorrectionLevel,
          margin: 1,
          width: type === 'svg' ? 200 : undefined
        };

        switch (type) {
          case 'terminal':
            // Use qrcode-terminal for better terminal output
            result = await generateTerminalQR(data, { small: true });
            break;
          case 'svg':
            result = await QRCode.toString(data, { ...options, type: 'svg' });
            break;
          case 'base64':
            const buffer = await QRCode.toBuffer(data, { ...options, type: 'png' });
            result = `data:image/png;base64,${buffer.toString('base64')}`;
            break;
          default:
            throw new Error(`Unsupported output type: ${type}`);
        }

        return {
          content: [{
            type: 'text',
            text: result
          }]
        };
      } catch (error) {
        throw new Error(`QR code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
};