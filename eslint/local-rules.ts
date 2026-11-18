import type { ESLint, Rule } from 'eslint';

const compilerDirective = /^(\/\s*<reference\s|\s*@ts-expect-error\s+\S)/;

const noComments: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Source files carry intent through names and types, not comments.' },
    messages: {
      comment: 'Express this through naming or structure; rationale belongs in docs.',
    },
    schema: [],
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (compilerDirective.test(comment.value)) continue;
          if (comment.value.trimStart().startsWith('eslint-')) continue;
          context.report({ loc: comment.loc ?? context.sourceCode.ast.loc, messageId: 'comment' });
        }
      },
    };
  },
};

export const localRules: ESLint.Plugin = {
  meta: { name: 'local' },
  rules: { 'no-comments': noComments },
};
