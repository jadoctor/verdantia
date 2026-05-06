import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Zod Schema para subidas de archivos (Gold Standard).
 * Previene que el servidor reciba archivos corruptos, gigantes o maliciosos.
 */
export const imageUploadSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, 'Por favor, sube un archivo válido.')
    .refine((file) => file.size <= MAX_FILE_SIZE, `El archivo es muy pesado. Máximo 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Solo se aceptan formatos .jpg, .jpeg, .png y .webp'
    ),
  entityType: z.enum(['especie', 'variedad', 'labor', 'plaga', 'documento', 'perfil'], {
    message: 'Tipo de entidad no reconocida.',
  }),
  entityId: z.string().min(1, 'ID de entidad requerido.'),
});

// Validación para generador IA
export const aiImageGenerationSchema = z.object({
  prompt: z.string().min(10, 'El prompt debe ser descriptivo (mínimo 10 caracteres).'),
  entityType: z.enum(['especie', 'documento']),
});
