import { CustomValidationPipe } from './validation.pipe';
import { BadRequestException } from '@nestjs/common';
import { IsEmail } from 'class-validator';

class TestDto {
  @IsEmail({}, { message: 'email must be an email' })
  email!: string;
}

describe('CustomValidationPipe', () => {
  let pipe: CustomValidationPipe;

  beforeEach(() => {
    pipe = new CustomValidationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should throw BadRequestException if validation fails', async () => {
    const pipe = new CustomValidationPipe();

    try {
      await pipe.transform({ email: 'bad' }, { type: 'body', metatype: TestDto });
      fail('Should have thrown an error');
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      const response = (e as any).getResponse();
      expect(response.message).toEqual([
        {
          property: 'email',
          constraints: { isEmail: 'email must be an email' },
        },
      ]);
    }
  });
});
