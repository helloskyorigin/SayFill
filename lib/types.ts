import { z } from "zod";
export const ItemSchema = z.object({title:z.string().max(200),description:z.string().max(700),evidence:z.string().max(600),dueDate:z.string().nullable(),required:z.boolean(),priority:z.enum(["high","medium","low"]),evidenceStatus:z.enum(["matched","review","missing"])});
export const AnalysisSchema = z.object({documentTitle:z.string().max(200),summary:z.string().max(1000),documentLanguage:z.string().max(100),issuer:z.string().nullable(),deadline:z.string().nullable(),deadlineEvidence:z.string().max(600),deadlineEvidenceStatus:z.enum(["matched","review","missing"]),items:z.array(ItemSchema).max(12),missingInformation:z.array(z.string()).max(12),cautions:z.array(z.string()).max(12)});
export type Analysis = z.infer<typeof AnalysisSchema>;
