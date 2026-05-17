import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfParserService } from './pdf-parser.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg']);

@Controller('parse-file')
export class PdfParserController {
  constructor(private readonly pdfParserService: PdfParserService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async parseFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();

    if (!IMAGE_EXTS.has(ext)) {
      throw new BadRequestException('Formato no soportado. Usa PNG o JPG.');
    }

    const result = await this.pdfParserService.extractFromImage(file.buffer);
    if (result.transactions.length === 0) {
      throw new BadRequestException({
        message: 'No se pudieron identificar fechas y montos en la imagen.',
        ocrRaw: result.ocrRaw,
      });
    }
    return { transactions: result.transactions, ocrRaw: result.ocrRaw };
  }
}
