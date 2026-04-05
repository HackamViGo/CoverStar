import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        // Типове commit-и за CoverStar
        'type-enum': [
            2,
            'always',
            [
                'feat',      // нова функционалност
                'fix',       // поправка на бъг
                'security',  // security fix — специален за нас!
                'test',      // тестове
                'refactor',  // рефакторинг без промяна на функционалност
                'style',     // форматиране, whitespace
                'docs',      // документация
                'chore',     // конфигурация, deps, build
                'perf',      // performance
                'revert',    // връщане на промени
                'wip',       // work in progress (само за dev branches)
            ],
        ],
        // Scope-овете на проекта
        'scope-enum': [
            1, // WARNING (не блокира)
            'always',
            [
                'auth',
                'gallery',
                'api',
                'middleware',
                'store',
                'pwa',
                'seo',
                'ui',
                'tests',
                'deps',
                'config',
                'hooks',
            ],
        ],
        'subject-min-length': [2, 'always', 10],
        'subject-max-length': [2, 'always', 100],
        'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
        'body-max-line-length': [1, 'always', 200],
    },
    // Помощно съобщение при грешка
    helpUrl: 'https://www.conventionalcommits.org',
};

export default config;