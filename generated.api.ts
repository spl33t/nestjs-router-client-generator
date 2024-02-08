export interface API {
  'AppController': {
    'createOrder /createOrder': (body: CreateOrderDto) => {},
  },
};
export interface CreateOrderDto {
    clientId: number;
    client: ClientModel;
    city: "Moscow" | "SaintPeterburg";
}
export interface ClientModel {
    userId: number;
    user: UserModel;
    id: number;
    createdAt: Date;
    updatedAt: Date;
    __model: unknown;
}
export interface UserModel {
    login: string;
    password: string;
    role: import("C:/Users/spl33/Desktop/2024-januar/nest-router-gen/ts-node-starter/src/models/user.model").UserRoleEnum;
    id: number;
    createdAt: Date;
    updatedAt: Date;
    __model: unknown;
}
