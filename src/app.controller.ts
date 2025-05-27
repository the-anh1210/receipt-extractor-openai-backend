import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    // storage: diskStorage({
    //   destination: './uploads',
    //   filename: (req, file, callback) => {
    //     const uniqueName = `${Date.now()}${extname(file.originalname)}`;
    //     callback(null, uniqueName);
    //   }
    // }),
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return cb(
          new Error('Only valid image files are allowed! (.jpg, .jpeg, .png, .gif)'), 
          false
        );
      }
      cb(null, true);
    },
  }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    try {
      return this.appService.handleUpload(file);
    } catch (error) {
      throw error;
    }
  }
}
