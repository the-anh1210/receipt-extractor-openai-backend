import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AppService {
  async handleUpload(file: Express.Multer.File) {
    const base64Image = file.buffer.toString('base64');

    const openaiResponse = await this.sendToOpenAI(base64Image, file.mimetype);

    return {
      result: openaiResponse.data
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

    return axios.post('https://api.openai.com/v1/chat/completions', payload, {
      headers: {
        Authorization: `Bearer ${'apiKey'}`,
        'Content-Type': 'application/json',
      }
    })
  }
}
