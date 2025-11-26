import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateVocabItemDto } from './dto/create-vocab-item.dto';
import { UpdateVocabItemDto } from './dto/update-vocab-item.dto';
import { CreateKanjiItemDto } from './dto/create-kanji-item.dto';
import { UpdateKanjiItemDto } from './dto/update-kanji-item.dto';
import { CreateGrammarPointDto } from './dto/create-grammar-point.dto';
import { UpdateGrammarPointDto } from './dto/update-grammar-point.dto';
import { CreateVocabTestDto } from './dto/create-vocab-test.dto';
import { UpdateVocabTestDto } from './dto/update-vocab-test.dto';
import { CreateKanjiTestDto } from './dto/create-kanji-test.dto';
import { UpdateKanjiTestDto } from './dto/update-kanji-test.dto';
import { CreateGrammarTestDto } from './dto/create-grammar-test.dto';
import { UpdateGrammarTestDto } from './dto/update-grammar-test.dto';
import { BulkCreateVocabItemDto } from './dto/bulk-create-vocab-item.dto';
import { BulkCreateKanjiItemDto } from './dto/bulk-create-kanji-item.dto';
import { BulkCreateGrammarPointDto } from './dto/bulk-create-grammar-point.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('vocab')
  async findAllVocabItems(@Query() queryDto: QueryContentDto) {
    return this.contentService.findAllVocabItems(queryDto);
  }

  @Get('vocab/:id')
  async findVocabItemById(@Param('id') id: string) {
    return this.contentService.findVocabItemById(id);
  }

  @Post('vocab')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createVocabItem(@Body() createVocabItemDto: CreateVocabItemDto) {
    return this.contentService.createVocabItem(createVocabItemDto);
  }

  @Put('vocab/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateVocabItem(
    @Param('id') id: string,
    @Body() updateVocabItemDto: UpdateVocabItemDto,
  ) {
    return this.contentService.updateVocabItem(id, updateVocabItemDto);
  }

  @Delete('vocab/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVocabItem(@Param('id') id: string) {
    await this.contentService.deleteVocabItem(id);
  }

  @Post('vocab/bulk')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreateVocabItems(@Body() bulkCreateDto: BulkCreateVocabItemDto) {
    return this.contentService.bulkCreateVocabItems(bulkCreateDto);
  }

  @Get('kanji')
  async findAllKanjiItems(@Query() queryDto: QueryContentDto) {
    return this.contentService.findAllKanjiItems(queryDto);
  }

  @Get('kanji/:id')
  async findKanjiItemById(@Param('id') id: string) {
    return this.contentService.findKanjiItemById(id);
  }

  @Post('kanji')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createKanjiItem(@Body() createKanjiItemDto: CreateKanjiItemDto) {
    return this.contentService.createKanjiItem(createKanjiItemDto);
  }

  @Put('kanji/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateKanjiItem(
    @Param('id') id: string,
    @Body() updateKanjiItemDto: UpdateKanjiItemDto,
  ) {
    return this.contentService.updateKanjiItem(id, updateKanjiItemDto);
  }

  @Delete('kanji/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteKanjiItem(@Param('id') id: string) {
    await this.contentService.deleteKanjiItem(id);
  }

  @Post('kanji/bulk')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreateKanjiItems(@Body() bulkCreateDto: BulkCreateKanjiItemDto) {
    return this.contentService.bulkCreateKanjiItems(bulkCreateDto);
  }

  @Get('grammar')
  async findAllGrammarPoints(@Query() queryDto: QueryContentDto) {
    return this.contentService.findAllGrammarPoints(queryDto);
  }

  @Get('grammar/:id')
  async findGrammarPointById(@Param('id') id: string) {
    return this.contentService.findGrammarPointById(id);
  }

  @Post('grammar')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createGrammarPoint(
    @Body() createGrammarPointDto: CreateGrammarPointDto,
  ) {
    return this.contentService.createGrammarPoint(createGrammarPointDto);
  }

  @Put('grammar/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateGrammarPoint(
    @Param('id') id: string,
    @Body() updateGrammarPointDto: UpdateGrammarPointDto,
  ) {
    return this.contentService.updateGrammarPoint(id, updateGrammarPointDto);
  }

  @Delete('grammar/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGrammarPoint(@Param('id') id: string) {
    await this.contentService.deleteGrammarPoint(id);
  }

  @Post('grammar/bulk')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreateGrammarPoints(
    @Body() bulkCreateDto: BulkCreateGrammarPointDto,
  ) {
    return this.contentService.bulkCreateGrammarPoints(bulkCreateDto);
  }

  @Get('vocab-tests')
  async findAllVocabTests(@Query() queryDto: QueryContentDto) {
    return this.contentService.findAllVocabTests(queryDto);
  }

  @Get('vocab-tests/:id')
  async findVocabTestById(@Param('id') id: string) {
    return this.contentService.findVocabTestById(id);
  }

  @Post('vocab-tests')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createVocabTest(@Body() createVocabTestDto: CreateVocabTestDto) {
    return this.contentService.createVocabTest(createVocabTestDto);
  }

  @Put('vocab-tests/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateVocabTest(
    @Param('id') id: string,
    @Body() updateVocabTestDto: UpdateVocabTestDto,
  ) {
    return this.contentService.updateVocabTest(id, updateVocabTestDto);
  }

  @Delete('vocab-tests/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVocabTest(@Param('id') id: string) {
    await this.contentService.deleteVocabTest(id);
  }

  @Get('kanji-tests')
  async findAllKanjiTests(@Query() queryDto: QueryContentDto) {
    return this.contentService.findAllKanjiTests(queryDto);
  }

  @Get('kanji-tests/:id')
  async findKanjiTestById(@Param('id') id: string) {
    return this.contentService.findKanjiTestById(id);
  }

  @Post('kanji-tests')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createKanjiTest(@Body() createKanjiTestDto: CreateKanjiTestDto) {
    return this.contentService.createKanjiTest(createKanjiTestDto);
  }

  @Put('kanji-tests/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateKanjiTest(
    @Param('id') id: string,
    @Body() updateKanjiTestDto: UpdateKanjiTestDto,
  ) {
    return this.contentService.updateKanjiTest(id, updateKanjiTestDto);
  }

  @Delete('kanji-tests/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteKanjiTest(@Param('id') id: string) {
    await this.contentService.deleteKanjiTest(id);
  }

  @Get('grammar-tests')
  async findAllGrammarTests(@Query() queryDto: QueryContentDto) {
    return this.contentService.findAllGrammarTests(queryDto);
  }

  @Get('grammar-tests/:id')
  async findGrammarTestById(@Param('id') id: string) {
    return this.contentService.findGrammarTestById(id);
  }

  @Post('grammar-tests')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createGrammarTest(@Body() createGrammarTestDto: CreateGrammarTestDto) {
    return this.contentService.createGrammarTest(createGrammarTestDto);
  }

  @Put('grammar-tests/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateGrammarTest(
    @Param('id') id: string,
    @Body() updateGrammarTestDto: UpdateGrammarTestDto,
  ) {
    return this.contentService.updateGrammarTest(id, updateGrammarTestDto);
  }

  @Delete('grammar-tests/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGrammarTest(@Param('id') id: string) {
    await this.contentService.deleteGrammarTest(id);
  }
}
