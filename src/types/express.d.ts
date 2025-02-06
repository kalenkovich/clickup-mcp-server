declare module "express" {
  import { Server } from "http";

  export interface Request {
    body: any;
    query: any;
    params: any;
    headers: any;
    path: string;
    method: string;
    url: string;
  }

  export interface Response {
    status(code: number): Response;
    json(data: any): void;
    send(data: any): void;
    redirect(url: string): void;
    sendFile(path: string): void;
    header: {
      location?: string;
    };
    body: any;
  }

  export interface NextFunction {
    (error?: any): void;
  }

  export interface RequestHandler {
    (req: Request, res: Response, next: NextFunction): void | Promise<void>;
  }

  export interface ErrorRequestHandler {
    (err: any, req: Request, res: Response, next: NextFunction): void;
  }

  export interface Application {
    use(path: string, router: any): void;
    use(middleware: RequestHandler | ErrorRequestHandler): void;
    get(path: string, ...handlers: Array<RequestHandler>): void;
    post(path: string, ...handlers: Array<RequestHandler>): void;
    put(path: string, ...handlers: Array<RequestHandler>): void;
    delete(path: string, ...handlers: Array<RequestHandler>): void;
    listen(port: number, callback?: () => void): Server;
  }

  export interface Router {
    use(path: string, router: any): void;
    use(middleware: RequestHandler | ErrorRequestHandler): void;
    get(path: string, ...handlers: Array<RequestHandler>): void;
    post(path: string, ...handlers: Array<RequestHandler>): void;
    put(path: string, ...handlers: Array<RequestHandler>): void;
    delete(path: string, ...handlers: Array<RequestHandler>): void;
  }

  export interface Express extends Application {
    Router(): Router;
    json(): RequestHandler;
    urlencoded(options: { extended: boolean }): RequestHandler;
    static(path: string): RequestHandler;
  }

  interface ExpressStatic {
    (): Express;
    Router(): Router;
    json(): RequestHandler;
    urlencoded(options: { extended: boolean }): RequestHandler;
    static(path: string): RequestHandler;
  }

  const express: ExpressStatic;
  export default express;
}
