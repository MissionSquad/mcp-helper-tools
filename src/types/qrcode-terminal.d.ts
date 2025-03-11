declare module 'qrcode-terminal' {
  interface QRCodeTerminalOptions {
    small?: boolean;
  }

  interface QRCodeTerminal {
    generate(text: string, callback: (result: string) => void): void;
    generate(text: string, options: QRCodeTerminalOptions, callback: (result: string) => void): void;
    setErrorLevel(error: string): void;
  }

  const qrcodeTerminal: QRCodeTerminal;
  export = qrcodeTerminal;
}