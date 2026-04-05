import { render, screen, fireEvent } from '@/test-utils';
import { SeoPreview } from '../SeoPreview';
import { describe, it, expect } from 'vitest';

describe('SeoPreview Component', () => {
  const defaultProps = {
    seoTitle: 'Título SEO',
    seoDescription: 'Descrição SEO personalizada para o evento.',
    name: 'Nome do Evento',
    slug: 'meu-evento',
    domain: 'eventhub.com.br',
    bannerUrl: 'http://example.com/banner.jpg'
  };

  it('deve renderizar a prévia do Google por padrão', () => {
    render(<SeoPreview {...defaultProps} />);

    expect(screen.getByText('Google Preview')).toHaveClass('text-primary');
    expect(screen.getByText('Título SEO')).toBeInTheDocument();
    expect(screen.getByText('Descrição SEO personalizada para o evento.')).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/eventhub.com.br\/events\/meu-evento/i)).toBeInTheDocument();
  });

  it('deve alternar para a prévia Social ao clicar na aba correspondente', () => {
    render(<SeoPreview {...defaultProps} />);

    const socialTab = screen.getByText('Social Preview');
    fireEvent.click(socialTab);

    expect(socialTab).toHaveClass('text-primary');
    expect(screen.getByText('Título SEO')).toBeInTheDocument();
    expect(screen.getByAltText('Banner')).toHaveAttribute('src', 'http://example.com/banner.jpg');
  });

  it('deve usar o nome do evento se o título SEO não for fornecido', () => {
    const props = { ...defaultProps, seoTitle: undefined };
    render(<SeoPreview {...props} />);
    expect(screen.getByText('Nome do Evento')).toBeInTheDocument();
  });

  it('deve mostrar "Sem Imagem" na prévia social se bannerUrl for nulo', () => {
    const props = { ...defaultProps, bannerUrl: null };
    render(<SeoPreview {...props} />);
    
    const socialTab = screen.getByText('Social Preview');
    fireEvent.click(socialTab);

    expect(screen.getByText('Sem Imagem')).toBeInTheDocument();
  });
});
