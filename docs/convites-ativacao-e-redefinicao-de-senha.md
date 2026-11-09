# SCC Produção — convites reais, ativação e senhas provisórias

## Implantação (09/11/2026)
- Frontend em `feat/primeiro-acesso`, build aprovado. A branch de publicação online `feat/admin-usuarios` permanece sem atualização.
- Política `scc_avatar_ler_admin` aplicada no storage privado. Apenas os próprios titulares e administradores podem ler fotos; nenhum admin pode editar/remover foto de outro usuário.
- Tabela `convites_ativacao` com RLS e sem grants de usuário comum, contendo somente SHA-256 do token e expiração.
- Edge Functions `convidar-usuario`, `concluir-ativacao`, `redefinir-senha-usuario` e `trocar-senha-inicial` implantadas com JWT obrigatório.

## Cadastro via convite
1. Administrador abre Administração > Convidar usuário e informa nome, e-mail e papel Leitor/Editor.
2. A função verifica administrador ativo e gera OTP de convite; grava somente o hash no banco e retorna link individual, sem envio automático de e-mail (compatível com plano gratuito).
3. Administrador copia e envia o link num canal privado; link local `localhost` é apenas para testes locais. Somente entregar link online quando a nova versão de frontend estiver publicada.
4. Usuário abre `/definir-senha`, preenche uma senha forte, e o navegador troca OTP por sessão válida de convite.
5. A função `concluir-ativacao` exige **JWT desse usuário e o token original correspondente ao hash armazenado**. Só então altera a senha e remove `troca_senha_pendente`, liberando a conta.
6. O navegador encerra a sessão de convite e apresenta a tela de login.

## Recuperação pelo administrador
1. Administração > usuário (Leitor/Editor) > Redefinir senha > confirmar.
2. API verifica o admin autenticado e marca `troca_senha_pendente=true`, bloqueando imediatamente consultas protegidas por `private.papel_atual()`.
3. API altera a senha para aleatória forte, mostrada **uma única vez** ao administrador; nunca imprime senha em logs.
4. Administrador transmite a credencial por canal privado.
5. Usuário faz login com a senha provisória e usa `/primeiro-acesso` para fornecer a senha provisória e escolher a definitiva. Não é possível redefinir senha de outro administrador.

## Checklist de homologação (não executado ainda)
- [ ] Testar nova conta de **teste** com link local, senha forte, login e visibilidade dos materiais.
- [ ] Confirmar que link inválido e link reutilizado são recusados.
- [ ] Confirmar que conta pendente não acessa materiais antes da ativação.
- [ ] Abrir Administração com conta admin: ver foto existente e iniciais sem foto.
- [ ] Confirmar que Leitor não pode ler foto de outro usuário (RLS storage).
- [ ] Redefinir apenas usuário descartável: antiga senha falha, nova provisória funciona e exige troca.
- [ ] Editor/Leitor recebem 403 nas funções administrativas.
- [ ] Ao concluir os testes, publicar o frontend no Cloudflare e **somente depois** distribuir links online reais.

Observação: o Supabase Advisor continua exibindo aviso para proteção contra senhas comprometidas desabilitada. Recomenda-se habilitar no painel quando disponível, independentemente da política local de senha forte.
