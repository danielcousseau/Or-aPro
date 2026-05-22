import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

export default function validate(schema: ZodSchema) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!schema) {
            res.status(500).json({ error: 'Erro interno: Schema de validação não definido ou importado incorretamente nas rotas.' });
            return;
        }

        try {
            // [SecOps] Usa parseAsync para não bloquear a thread principal (previne DoS).
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Dados inválidos enviados no formulário',
                    details: error.issues.map((issue: ZodIssue) => ({
                        campo: issue.path.join('.'),
                        mensagem: issue.message
                    }))
                });
                return;
            }
            next(error);
        }
    };
}
