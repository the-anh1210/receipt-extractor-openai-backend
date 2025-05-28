import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { InjectRepository } from '@nestjs/typeorm';
import { Detail } from './entity/detail.entity';
import { Repository } from 'typeorm';
import { createDetailDTO } from './dto/create.detail';
import { uploadFile } from '@uploadcare/upload-client';

@Injectable()
export class AppService {
  private openai = new OpenAI({
    apiKey: this.configService.get('OPENAI_API_KEY')
  });
  
  @InjectRepository(Detail)
  private detailRepository: Repository<Detail>

  constructor(private configService: ConfigService) {}

  async extractReceiptDetails(file: Express.Multer.File) {
    try {
      const base64Image = file.buffer.toString('base64');
      
      const imageUrl = await this.saveFile(file);
      
      const openaiResponse = await this.sendToOpenAI(base64Image, file.mimetype);
      
      const json = JSON.parse(openaiResponse.content);
      
      return {
        result: await this.saveDetails(file, { ...json, image_url: imageUrl })
      }
    } catch (error) {
      console.log(error);
      throw new HttpException('Invaild Result', HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    const result = await uploadFile(file.buffer, {
      publicKey: this.configService.get('UPLOADCARE_API_KEY'),
      store: 'auto',
    });
    console.log(result.cdnUrl);
    return result.cdnUrl;
  }

  async saveDetails(file: Express.Multer.File, dto: createDetailDTO): Promise<Detail> {
    const detail = this.detailRepository.create(dto);
    return await this.detailRepository.save(detail);
  }

  private async sendToOpenAI(base64: string, mimetype: string) {
   
    const prompt = `
      You are an intelligent document parser. Extract structured information from the receipt image provided.

      Return the result in the following JSON format:

      {
        "date": "YYYY-MM-DD",
        "currency": "USD",
        "vendor": "Vendor Name",
        "items": [
          { "name": "Item 1", "cost": 12.99 },
          { "name": "Item 2", "cost": 8.50 }
        ],
        "tax": 2.50,
        "total": 24.00
      }

      Notes:
      - Use ISO 8601 format for dates (YYYY-MM-DD).
      - Use a 3-letter ISO 4217 currency code (e.g., USD, EUR, AUD).
      - If any field is not clearly visible or missing, return it as null.
      - Don 't contain any extra characters like 'json'.
      - If result is unterminated json string, please make it approximately vaild json.
      `;
    
    const completions = await this.openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimetype};base64,${base64}` } }
          ]
        }
      ],
      max_tokens: 1000,
    });

    return completions.choices[0].message;
  }
}
