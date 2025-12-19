import { z } from 'zod';

export const bannerNameSchema = z.enum([
	'V1',
	'TRIAL_OVER',
	'TRIAL',
	'EMAIL_CONFIRMATION',
	'DATA_TABLE_STORAGE_LIMIT_WARNING',
	'DATA_TABLE_STORAGE_LIMIT_ERROR',
]);

export type BannerName = z.infer<typeof bannerNameSchema>;
