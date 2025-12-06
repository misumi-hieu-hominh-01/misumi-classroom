import { apiClient } from "./api-client";
import type { ApiResponse } from "../types";

export interface User {
	id: string;
	email: string;
	displayName: string;
	role: string;
	status: string;
	courseStartDate?: string;
	createdAt?: string;
}

export interface UpdateUserDto {
	displayName?: string;
	courseStartDate?: string;
}

export const usersApi = {
	async getAllUsers(): Promise<User[]> {
		const response = await apiClient.get<ApiResponse<User[]>>("/users");
		return response.data;
	},

	async updateUser(id: string, data: UpdateUserDto): Promise<User> {
		const response = await apiClient.patch<ApiResponse<User>>(
			`/users/${id}`,
			data
		);
		return response.data;
	},

	async getCurrentUser(): Promise<User> {
		const response = await apiClient.get<ApiResponse<User>>("/users/me");
		return response.data;
	},
};

