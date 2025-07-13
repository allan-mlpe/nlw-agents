import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from '../../db/connection.ts';
import { schema } from '../../db/schema/index.ts';
import { z } from 'zod/v4';
import { generateEmbeddings } from "../../services/gemini.ts";
import { and, eq, sql } from "drizzle-orm";

export const createQuestionRoute: FastifyPluginCallbackZod = (app) => {
    app.post('/rooms/:roomId/questions', {
        schema: {
            params: z.object({
                roomId: z.string(),
            }),
            body: z.object({
                question: z.string().min(1),
            }),
        },
    }, async (request, reply) => {
        const { roomId } = request.params;
        const { question } = request.body;

        const embeddings = await generateEmbeddings(question);
        const embeddingsAsString = `[${embeddings.join(',')}]`;

        const chunks = await db
            .select({
                id: schema.audioChunks.id,
                transcription: schema.audioChunks.transcription,
                similarity: sql<number>`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector)`
            })
            .from(schema.audioChunks)
            .where(
                and(
                    eq(schema.audioChunks.roomId, roomId),
                    sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector) > 0.7` /* <=> : é um operador usado para comparar vetores
                                                                                           0.7 : é o grau de similaridade que estamos querendo entre os vetores. Quanto mais perto de 1, mais similaridade existe entre os textos.
                                                                                        */

                )  
            )
            .orderBy(
                sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector)`
            )
            .limit(3);
        
        const result = await db
            .insert(schema.questions)
            .values({ roomId, question })
            .returning();

        const insertedQuestion = result[0];

        if (!insertedQuestion) {
            throw new Error('Failed to create new room.');
        }
        
        return reply.status(201).send({ questionId: insertedQuestion.id });
    });
};