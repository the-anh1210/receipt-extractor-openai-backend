import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

@Injectable()
export class AppService {
  private openai = new OpenAI({
    apiKey: this.configService.get('OPENAI_API_KEY')
  });

  constructor(private configService: ConfigService) {}

  async handleUpload(file: Express.Multer.File) {
    try {
      const base64Image = file.buffer.toString('base64');

      const openaiResponse = await this.sendToOpenAI(base64Image, file.mimetype);

      return {
        result: openaiResponse
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
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
      `;
    
    const payload = {
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimetype};base64,${base64}` } }
          ]
        }
      ],
      max_tokens: 500,
    }

    const completions = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            // { type: 'image_url', image_url: { url: `data:${mimetype};base64,${base64}` } }
          ]
        }
      ],
      max_tokens: 500,
    });

    return completions.choices[0].message;
  }
}
