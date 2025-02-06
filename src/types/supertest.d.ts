declare module "supertest" {
  import { Response } from "express";

  interface Test {
    get(url: string): Test;
    post(url: string): Test;
    put(url: string): Test;
    delete(url: string): Test;
    set(key: string, value: string): Test;
    send(data: any): Test;
    query(data: any): Test;
    expect(status: number): Promise<Response>;
  }

  function request(app: any): Test;
  export = request;
}
