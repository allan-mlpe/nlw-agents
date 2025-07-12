import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from '../../db/connection.ts';
import { schema } from '../../db/schema/index.ts';
import { z } from 'zod/v4';
import { transcribeAudio } from "../../services/gemini.ts";

export const uploadAudioRoute: FastifyPluginCallbackZod = (app) => {
    app.post('/rooms/:roomId/audio', {
        schema: {
            params: z.object({
                roomId: z.string(),
            }),
        },
    }, async (request, reply) => {
        const { roomId } = request.params;
        const audio = await request.file();

        if (!audio) {
            throw new Error('Audio is required.');
        }

        const audioBuffer = await audio.toBuffer(); // espera o arquivo ser carregado por completo, uma vez que serão arquivos pequenos
        const audioAsBase64 = audioBuffer.toString('base64');

        const transcription = await transcribeAudio(audioAsBase64, audio.mimetype);

        return { transcription };
    });
};