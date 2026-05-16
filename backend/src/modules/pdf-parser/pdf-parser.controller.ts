import {
  Controller, Post, UseInterceptors, UploadedFile,
  Body, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfParserService } from './pdf-parser.service';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg']);

@Controller('parse-file')
export class PdfParserController {
  constructor(private readonly pdfParserService: PdfParserService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async parseFile(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();

    if (!IMAGE_EXTS.has(ext)) {
      throw new BadRequestException(
        'Formato no soportado. Usa PNG o JPG.',
      );
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
