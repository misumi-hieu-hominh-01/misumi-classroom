import { apiClient } from './api-client';
import type { ApiResponse } from '../types';

export interface AssignmentPools {
	vocabIds: string[];
	kanjiIds: string[];
	grammarIds: string[];
}

export interface AssignmentLimits {
	vocab: number;
	kanji: number;
	grammar: number;
}

export interface AssignmentUsed {
	vocab: number;
	kanji: number;
	grammar: number;
}

export interface DailyReviewAssignment {
	_id: string;
	userId: string;
	dateKey: string;
	sourceDateKey: string;
	generatedAt: string;
	pools: AssignmentPools;
	limits: AssignmentLimits;
	used: AssignmentUsed;
	status: 'active' | 'completed';
}

export interface WeeklyAssignment {
	_id: string;
	userId: string;
	period: string;
	generatedAt: string;
	pools: AssignmentPools;
	limits: AssignmentLimits;
	used: AssignmentUsed;
	status: 'active' | 'completed';
}

export interface MonthlyAssignment {
	_id: string;
	userId: string;
	period: string;
	generatedAt: string;
	pools: AssignmentPools;
	limits: AssignmentLimits;
	used: AssignmentUsed;
	status: 'active' | 'completed';
}

export interface AssignmentStatus {
	pools: AssignmentPools;
	used: AssignmentUsed;
	limits: AssignmentLimits;
	status: 'active' | 'completed';
	period?: string;
}

export const assignmentsApi = {
	async getDailyReviewToday(): Promise<DailyReviewAssignment> {
		const response = await apiClient.get<
			ApiResponse<DailyReviewAssignment>
		>('/assignments/daily-review/today');
		return response.data;
	},

	async getDailyReviewStatus(): Promise<AssignmentStatus | null> {
		const response = await apiClient.get<ApiResponse<AssignmentStatus>>(
			'/assignments/daily-review/status',
		);
		return response.data;
	},

	async getWeeklyCurrent(): Promise<WeeklyAssignment> {
		const response = await apiClient.get<ApiResponse<WeeklyAssignment>>(
			'/assignments/weekly/current',
		);
		return response.data;
	},

	async getWeeklyStatus(): Promise<AssignmentStatus | null> {
		const response = await apiClient.get<ApiResponse<AssignmentStatus>>(
			'/assignments/weekly/status',
		);
		return response.data;
	},

	async getWeeklyByPeriod(period: string): Promise<WeeklyAssignment | null> {
		const response = await apiClient.get<ApiResponse<WeeklyAssignment>>(
			`/assignments/weekly/${period}`,
		);
		return response.data;
	},

	async getMonthlyCurrent(): Promise<MonthlyAssignment> {
		const response = await apiClient.get<ApiResponse<MonthlyAssignment>>(
			'/assignments/monthly/current',
		);
		return response.data;
	},

	async getMonthlyStatus(): Promise<AssignmentStatus | null> {
		const response = await apiClient.get<ApiResponse<AssignmentStatus>>(
			'/assignments/monthly/status',
		);
		return response.data;
	},

	async getMonthlyByPeriod(
		period: string,
	): Promise<MonthlyAssignment | null> {
		const response = await apiClient.get<ApiResponse<MonthlyAssignment>>(
			`/assignments/monthly/${period}`,
		);
		return response.data;
	},
};

