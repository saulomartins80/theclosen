import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FiGithub, FiTwitter, FiLinkedin, FiInstagram } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';

export const Footer: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    produto: [
      { label: 'Recursos', href: '/recursos' },
      { label: 'Soluções', href: '/solucoes' },
      { label: 'Preços', href: '/precos' },
      { label: 'Clientes', href: '/clientes' },
    ],
    empresa: [
      { label: 'Sobre', href: '/sobre' },
      { label: 'Blog', href: '/blog' },
      { label: 'Carreiras', href: '/carreiras' },
      { label: 'Contato', href: '/contato' },
    ],
    legal: [
      { label: 'Termos', href: '/termos' },
      { label: 'Privacidade', href: '/privacidade' },
      { label: 'Cookies', href: '/cookies' },
    ],
  };

  // Filtrar links do produto para não mostrar a página atual
  const currentPath = router.pathname;
  const filteredProdutoLinks = footerLinks.produto.filter(link => link.href !== currentPath);

  const socialLinks = [
    { icon: FiGithub, href: 'https://github.com/theclosen' },
    { icon: FiTwitter, href: 'https://twitter.com/theclosen' },
    { icon: FiLinkedin, href: 'https://linkedin.com/company/theclosen' },
    { icon: FiInstagram, href: 'https://instagram.com/theclosen' },
  ];

  return (
    <footer className="bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="h-8 w-auto relative">
              <Image
                src="/logo.svg"
                alt="TheClosen"
                width={32} // Set appropriate width
                height={32} // Set appropriate height
                className="object-contain"
              />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
                >
                  <social.icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              {t('footer.product')}
            </h3>
            <ul className="mt-4 space-y-4">
              {filteredProdutoLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              {t('footer.company')}
              </h3>
              <ul className="mt-4 space-y-4">
              {footerLinks.empresa.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              {t('footer.legal')}
            </h3>
            <ul className="mt-4 space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-base text-gray-500 dark:text-gray-400 text-center">
            &copy; {currentYear} TheClosen. {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};