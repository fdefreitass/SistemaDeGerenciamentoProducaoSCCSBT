-- IMPORTAÇÃO SCC PRODUÇÃO / OPEC X MKT
-- Fonte: https://docs.google.com/spreadsheets/d/1RAS7M_6Z-_A-KAy83KzAnv6iATSIqBVADn0_UBZZALU/
-- 164 linhas com títulos, consolidadas em 161 materiais únicos por código.
-- Importação reversível via dump/backup (não usar delete em massa).
-- Não atribui status ou classificação não fornecidos.
BEGIN;

create table if not exists private.opec_x_mkt_fonte_20261109 (
 r integer primary key,
 g text,
 s text not null,
 c text,
 t text not null,
 d integer,
 i date,
 f date,
 e text,
 o text,
 n text,
 x date
);
revoke all on private.opec_x_mkt_fonte_20261109 from public, anon, authenticated;
alter table private.opec_x_mkt_fonte_20261109 enable row level security;

insert into private.opec_x_mkt_fonte_20261109 (r,g,s,c,t,d,i,f,e,o,n,x)
select r,g,s,c,t,d,i,f,e,o,n,x
from jsonb_to_recordset('[{"r":4,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5544","t":"CH SILVIO SANTOS","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-17"},{"r":5,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5026","t":"CH TELE SENA","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-17"},{"r":6,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5254","t":"CH THE NOITE","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-17"},{"r":7,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5396","t":"CH WEB MOTORS","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-17"},{"r":8,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5149","t":"CH SBT SPORT","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-17"},{"r":9,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5788","t":"CH A PRAÇA É NOSSA","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-17"},{"r":10,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5575","t":"CH A TARDE É NOSSA","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-17"},{"r":11,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5478","t":"CH DOMINGO LEGAL","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-17"},{"r":12,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5693","t":"RAIZES CATARINENSES LAGES","d":15,"i":"2026-08-20","e":"OK","x":"2026-08-17"},{"r":13,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5214","t":"RAIZES CATARINENSES S JOAQUIM","d":15,"i":"2026-08-20","e":"OK","x":"2026-08-17"},{"r":14,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5413","t":"RAIZES CATARINENSES BLUMENAU","d":15,"i":"2026-08-20","e":"OK","x":"2026-08-17"},{"r":15,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5296","t":"CALHAU - DIVERSÃO - FOFOCALIZANDO","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":16,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5074","t":"CALHAU - DIVERSÃO - THE NOITE","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":17,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5253","t":"CALHAU - DIVERSÃO - OPERAÇÃO MESQUITA","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":18,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5299","t":"CALHAU - DIVERSÃO - PROGRAMA DO RATINHO","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":19,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5319","t":"CALHAU - SAÚDE - SONO","d":30,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":20,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5317","t":"CALHAU - SAÚDE - EXERCÍCIO","d":30,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":21,"g":"SEM SEÇÃO NA PLANILHA","s":"AVULSOS","c":"5535","t":"CALHAU - SAÚDE - ALIMENTAÇÃO","d":30,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":23,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5563","t":"CH DQ A POUCO - A TARDE É NOSSA","d":15,"i":"2026-04-27","f":"2026-08-31","n":"MUDANÇA DE HORÁRIO","x":"2026-04-27"},{"r":24,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5466","t":"CH BASTIDORES A TARDE É NOSSA INST","d":45,"i":"2026-04-27","n":"MUDANÇA DE HORÁRIO","x":"2026-04-27"},{"r":25,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5613","t":"CH DQ A POUCO - SCC MEIO-DIA","d":15},{"r":26,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5177","t":"CH PROG. SEGUNDA - MANHÃ","d":30,"e":"OK"},{"r":27,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5513","t":"CH PROG. SEGUNDA - TARDE","d":30,"e":"OK"},{"r":28,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5633","t":"CH PROG. SEGUNDA - NOITE 1","d":30,"e":"OK"},{"r":29,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5281","t":"02 - CH_HORÁRIO - SEGUNDA - NOITE 2","d":30,"e":"OK"},{"r":30,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5655","t":"CH PROG. TERÇA - MANHÃ","d":30,"e":"OK"},{"r":31,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5451","t":"CH PROG. TERÇA - TARDE","d":30,"e":"OK"},{"r":32,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5378","t":"CH PROG. TERÇA - NOITE 1","d":30,"e":"OK"},{"r":33,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5283","t":"03- CH_HORÁRIO - TERÇA - NOITE 2","d":30,"e":"OK"},{"r":34,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5370","t":"CH PROG. QUARTA - MANHÃ","d":30,"e":"OK"},{"r":35,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5354","t":"CH PROG. QUARTA - TARDE","d":30,"e":"OK"},{"r":36,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5573","t":"CH PROG. QUARTA - NOITE 1","d":30,"e":"OK"},{"r":37,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5284","t":"04- CH_HORÁRIO - QUARTA - NOITE 2","d":30,"e":"OK"},{"r":38,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5599","t":"CH PROG. QUINTA - MANHÃ","d":30,"e":"OK"},{"r":39,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5461","t":"CH PROG. QUINTA - TARDE","d":30,"e":"OK"},{"r":40,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5009","t":"CH PROG. QUINTA - NOITE 1","d":30,"e":"OK"},{"r":41,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5285","t":"05- CH_HORÁRIO - QUINTA- NOITE 2","d":30,"e":"OK"},{"r":42,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5648","t":"CH PROG. SEXTA - MANHÃ","d":30,"e":"OK"},{"r":43,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5380","t":"CH PROG. SEXTA - TARDE","d":30,"e":"OK"},{"r":44,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5211","t":"CH PROG. SEXTA - NOITE 1","d":30,"e":"OK"},{"r":45,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5291","t":"06- CH_HORÁRIO - SEXTA - NOITE 2","d":30,"e":"OK"},{"r":46,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5640","t":"CH PROG. SÁBADO - MANHÃ","d":30,"e":"OK"},{"r":47,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5610","t":"CH DQ A POUCO - SBT NOTÍCIAS 11H","d":30,"e":"OK"},{"r":48,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5007","t":"CH PROG. SÁBADO - NOITE","d":30,"e":"OK"},{"r":49,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5221","t":"CH PROG. SÁBADO - TARDE","d":30,"e":"OK"},{"r":50,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5264","t":"01 - PROGRAMAÇÃO  - DOMINGO - MANHÃ","d":30,"e":"OK"},{"r":51,"g":"PROGRAMAÇÃO SEMANAL","s":"PROGRAMAÇÃO SEMANAL","c":"5395","t":"CH PROG. DOMINGO - DIA TODO","d":30,"e":"OK"},{"r":53,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","t":"CH DQ A POUCO - SÁBADO ANIMADO","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":54,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5562","t":"CH DQ A POUCO - A PRAÇA NOSSA","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":55,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5595","t":"CH DQ A POUCO - PROGRAMA DO RATINHO","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":56,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5613","t":"CH DQ A POUCO - SCC MEIO DIA","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":57,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5387","t":"CH DQ A POUCO - TA NA HORA SC","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":58,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5614","t":"CH DQ A POUCO - THE NOITE","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":59,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5546","t":"CH DQ A POUCO - PRIMEIRO IMPACTO","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":60,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5209","t":"CH DQ A POUCO - COMÉDIA SBT","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":61,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5108","t":"CH DQ A POUCO - VIVA A NOITE","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":62,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5657","t":"CH DQ A POUCO - PROGRAMA DO JOÃO","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":63,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5563","t":"CH DQ A POUCO - A TARDE É NOSSA","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":64,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5143","t":"CH DQ A POUCO - SBT NOTICIAS 2","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":65,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5608","t":"CH DQ A POUCO - SBT BRASIL","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":66,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5576","t":"CH DQ A POUCO - CHAVES","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":67,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5586","t":"CH DQ A POUCO - FOFOCALIZANDO","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":68,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5562","t":"CH DQ A POUCO - A PRAÇA É NOSSA","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":69,"g":"DAQUI A POUCO","s":"DAQUI A POUCO","c":"5523","t":"CH DQ A POUCO - EITA LUCAS","d":15,"i":"2026-08-28","e":"OK","x":"2026-08-28"},{"r":71,"g":"SABOR GERMÂNICO","s":"SABOR GERMÂNICO","t":"CH TEASER","d":30,"i":"2026-09-24","f":"2026-09-29","e":"OK"},{"r":72,"g":"SABOR GERMÂNICO","s":"SABOR GERMÂNICO","c":"5532","t":"CH LAÉRCIO ATN LAGES V1","d":15,"i":"2025-09-03","f":"2025-12-03"},{"r":73,"g":"SABOR GERMÂNICO","s":"SABOR GERMÂNICO","c":"5536","t":"CH LAÉRCIO ATN LAGES V2","d":15,"i":"2025-09-03","f":"2025-12-03"},{"r":74,"g":"SABOR GERMÂNICO","s":"SABOR GERMÂNICO","c":"5429","t":"CH - ANGÉLICA LAGES CAMPO","d":15,"i":"2025-10-08","f":"2025-01-15"},{"r":76,"g":"SCC NEWS","s":"SCC NEWS","t":"CH SCC NEWS 2026 03","d":30,"i":"2026-09-08","e":"OK"},{"r":78,"g":"PONTO E CONTRA PONTO","s":"PONTO E CONTRA PONTO","t":"CH PONTO E CONTRA PONTO 3","d":30,"i":"2026-09-01","e":"OK"},{"r":80,"g":"DIRETO AO VOTO","s":"DIRETO AO VOTO","t":"CH PONTO E DIRETO AO VOTO 1","d":30,"i":"2026-09-15","e":"OK"},{"r":81,"g":"DIRETO AO VOTO","s":"DIRETO AO VOTO","t":"CH PONTO E DIRETO AO VOTO 2","d":30,"i":"2026-09-15","e":"OK"},{"r":83,"g":"VINHETAS","s":"VINHETAS","c":"5738","t":"INFORMAÇÃO VINHETA ZANOTTO 01","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":84,"g":"VINHETAS","s":"VINHETAS","c":"5690","t":"INFORMAÇÃO VINHETA ZANOTTO 01 - 10s","d":10,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":85,"g":"VINHETAS","s":"VINHETAS","c":"5698","t":"INFORMAÇÃO VINHETA ZANOTTO 02","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":86,"g":"VINHETAS","s":"VINHETAS","c":"5479","t":"INFORMAÇÃO VINHETA ZANOTTO 02 - 10s","d":10,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":87,"g":"VINHETAS","s":"VINHETAS","c":"5473","t":"INFORMAÇÃO VINHETA ZANOTTO 03","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":88,"g":"VINHETAS","s":"VINHETAS","c":"5477","t":"INFORMAÇÃO VINHETA ZANOTTO 03 - 10s","d":10,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":89,"g":"VINHETAS","s":"VINHETAS","c":"5688","t":"DIVERSÃO VINHETA MARICOTA 01","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":90,"g":"VINHETAS","s":"VINHETAS","c":"5740","t":"DIVERSÃO VINHETA MARICOTA 01 - 10s","d":10,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":91,"g":"VINHETAS","s":"VINHETAS","c":"5723","t":"DIVERSÃO VINHETA MARICOTA 02","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":92,"g":"VINHETAS","s":"VINHETAS","c":"5745","t":"DIVERSÃO VINHETA MARICOTA 02 - 10s","d":10,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":93,"g":"VINHETAS","s":"VINHETAS","c":"5096","t":"DIVERSÃO VINHETA MARICOTA  03","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":94,"g":"VINHETAS","s":"VINHETAS","c":"5004","t":"DIVERSÃO VINHETA MARICOTA 03 - 10s","d":10,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":95,"g":"VINHETAS","s":"VINHETAS","c":"5703","t":"ESPORTE VINHETA ANGELICA 01 - 10s","d":10,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":96,"g":"VINHETAS","s":"VINHETAS","c":"5374","t":"ESPORTE VINHETA ANGELICA 01","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":97,"g":"VINHETAS","s":"VINHETAS","c":"5355","t":"ESPORTE VINHETA ANGELICA 02 - 10s","d":10,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":98,"g":"VINHETAS","s":"VINHETAS","c":"5440","t":"ESPORTE VINHETA ANGELICA 02","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":99,"g":"VINHETAS","s":"VINHETAS","c":"5430","t":"ESPORTE VINHETA ANGELICA 03","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":100,"g":"VINHETAS","s":"VINHETAS","c":"5753","t":"ESPORTE VINHETA ANGELICA 03 - 10s_1","d":10,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":101,"g":"VINHETAS","s":"VINHETAS","c":"5389","t":"INFORMAÇÃO VINHETA JULIA 01 - 10s","d":10,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":102,"g":"VINHETAS","s":"VINHETAS","c":"5485","t":"INFORMAÇÃO VINHETA JULIA 01","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":103,"g":"VINHETAS","s":"VINHETAS","c":"5486","t":"INFORMAÇÃO VINHETA JULIA 02 - 10s","d":10,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":104,"g":"VINHETAS","s":"VINHETAS","c":"5517","t":"INFORMAÇÃO VINHETA JULIA 02","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":105,"g":"VINHETAS","s":"VINHETAS","c":"5031","t":"INFORMAÇÃO VINHETA JULIA 03 - 10s","d":10,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":106,"g":"VINHETAS","s":"VINHETAS","c":"5371","t":"INFORMAÇÃO VINHETA JULIA 03","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":107,"g":"VINHETAS","s":"VINHETAS","c":"5182","t":"DIVERSÃO VINHETA LAERCIO 01 - 10s","d":10,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":108,"g":"VINHETAS","s":"VINHETAS","c":"5061","t":"DIVERSÃO VINHETA LAERCIO 01","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":109,"g":"VINHETAS","s":"VINHETAS","c":"5797","t":"DIVERSÃO VINHETA LAERCIO 02 - 10s","d":10,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":110,"g":"VINHETAS","s":"VINHETAS","c":"5596","t":"DIVERSÃO VINHETA LAERCIO 02","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":111,"g":"VINHETAS","s":"VINHETAS","c":"5375","t":"DIVERSÃO VINHETA LAERCIO 03 - 10s","d":10,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":112,"g":"VINHETAS","s":"VINHETAS","c":"5190","t":"DIVERSÃO VINHETA LAERCIO 03","d":7,"i":"2026-08-20","e":"OK","x":"2026-08-18"},{"r":114,"g":"CHAMADAS EM USO - SCC MEIO DIA / ESPORTE","s":"CHAMADAS EM USO - SCC MEIO DIA / ESPORTE","c":"5006","t":"CH SCC MEIO DIA INST","d":30,"e":"OK","n":"ASSINATURA 45 ANOS"},{"r":115,"g":"CHAMADAS EM USO - SCC MEIO DIA / ESPORTE","s":"CHAMADAS EM USO - SCC MEIO DIA / ESPORTE","t":"CH SCC MEIO DIA 2026","d":30,"e":"OK"},{"r":118,"g":"CHAMADAS EM USO - A TARDE É NOSSA","s":"CHAMADAS EM USO - A TARDE É NOSSA","c":"5185","t":"CH ATRD INST MARICOTINHA 2","d":45,"n":"MUDANÇA DE HORÁRIO"},{"r":119,"g":"CHAMADAS EM USO - A TARDE É NOSSA","s":"CHAMADAS EM USO - A TARDE É NOSSA","c":"5456","t":"CH A TARDE NOSSA DIA MARICOTIN","d":45,"n":"MUDANÇA DE HORÁRIO"},{"r":120,"g":"CHAMADAS EM USO - A TARDE É NOSSA","s":"CHAMADAS EM USO - A TARDE É NOSSA","c":"5018","t":"CH A TARDE - INST 2026 1","d":45,"n":"MUDANÇA DE HORÁRIO"},{"r":121,"g":"CHAMADAS EM USO - A TARDE É NOSSA","s":"CHAMADAS EM USO - A TARDE É NOSSA","c":"5174","t":"CH A TARDE - INST 2026 2","d":30,"n":"ASSINATURA 45 ANOS"},{"r":126,"g":"RAIZES CATARINENSES","s":"RAIZES CATARINENSES","c":"5208","t":"RAIZES CATARINENSES MAFRA","d":15,"i":"2026-08-20","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":127,"g":"RAIZES CATARINENSES","s":"RAIZES CATARINENSES","c":"5729","t":"RAIZES CATARINENSES SANTA CECÍLIA","d":15,"i":"2026-08-20","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":128,"g":"RAIZES CATARINENSES","s":"RAIZES CATARINENSES","c":"5068","t":"RAIZES CATARINENSES SÃO FRANCISCO","d":15,"i":"2026-08-20","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":129,"g":"RAIZES CATARINENSES","s":"RAIZES CATARINENSES","c":"5791","t":"RAIZES CATARINENSES TREZE TÍLIAS","d":15,"i":"2026-08-20","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":130,"g":"RAIZES CATARINENSES","s":"RAIZES CATARINENSES","c":"5307","t":"RAIZES CATARINENSES XANXERÊ","d":15,"i":"2026-08-20","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":131,"g":"RAIZES CATARINENSES","s":"RAIZES CATARINENSES","c":"5627","t":"RAIZES CATARINENSES BOMBINHAS","d":15,"i":"2026-08-20","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":132,"g":"RAIZES CATARINENSES","s":"RAIZES CATARINENSES","c":"5287","t":"RAIZES CATARINENSES CHAPECÓ","d":15,"i":"2026-08-20","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":133,"g":"RAIZES CATARINENSES","s":"RAIZES CATARINENSES","c":"5058","t":"RAIZES CATARINENSES GAROPABA","d":15,"i":"2026-08-20","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":134,"g":"RAIZES CATARINENSES","s":"RAIZES CATARINENSES","c":"5352","t":"RAIZES CATARINENSES JOINVILLE","d":15,"i":"2026-08-20","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":135,"g":"RAIZES CATARINENSES","s":"RAIZES CATARINENSES","c":"5134","t":"RAIZES CATARINENSES URUBICI","d":15,"i":"2026-08-20","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":136,"g":"RAIZES CATARINENSES","s":"RAIZES CATARINENSES","c":"5516","t":"RAIZES CATARINENSES BALN CAMB","d":15,"i":"2026-08-20","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":138,"g":"IBOPE 2026","s":"IBOPE 2026","c":"5369","t":"CH SE LIGA BRASIL","d":7,"i":"2026-08-28","f":"2026-10-30","e":"OK","o":"ok","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-28"},{"r":139,"g":"IBOPE 2026","s":"IBOPE 2026","c":"5179","t":"CH PÉ NA ESTRADA","d":7,"i":"2026-08-20","f":"2026-10-30","e":"OK","o":"ok","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":140,"g":"IBOPE 2026","s":"IBOPE 2026","c":"5215","t":"CH PRIMEIRO IMPACTO","d":7,"i":"2026-08-20","f":"2026-10-30","e":"OK","o":"ok","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":141,"g":"IBOPE 2026","s":"IBOPE 2026","c":"5289","t":"CH SBT BRASIL","d":7,"i":"2026-08-20","f":"2026-10-30","e":"OK","o":"ok","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":142,"g":"IBOPE 2026","s":"IBOPE 2026","c":"5794","t":"CH SCC MEIO DIA","d":7,"i":"2026-08-20","f":"2026-10-03","e":"OK","o":"ok","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":143,"g":"IBOPE 2026","s":"IBOPE 2026","c":"5202","t":"TS OPERAÇÃO MESQUITA","d":7,"i":"2026-08-20","f":"2026-10-30","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":144,"g":"IBOPE 2026","s":"IBOPE 2026","c":"5494","t":"CH PROGRAMA DO RATINHO","d":7,"i":"2026-08-20","f":"2026-10-30","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":145,"g":"IBOPE 2026","s":"IBOPE 2026","c":"5642","t":"TS FOFOCALIZANDO","d":7,"i":"2026-08-20","f":"2026-10-30","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-17"},{"r":146,"g":"IBOPE 2026","s":"IBOPE 2026","c":"5628","t":"IBOPE LAGES","d":30,"i":"2026-08-28","f":"2026-10-30","e":"OK","o":"ok","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-28"},{"r":147,"g":"IBOPE 2026","s":"IBOPE 2026","c":"5774","t":"IBOPE CHAPECÓ","d":30,"i":"2026-08-28","f":"2026-10-30","e":"OK","o":"ok","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-28"},{"r":148,"g":"IBOPE 2026","s":"IBOPE 2026","c":"5482","t":"IBOPE JOINVILLE","d":30,"i":"2026-08-28","f":"2026-10-30","e":"OK","o":"ok","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-28"},{"r":149,"g":"IBOPE 2026","s":"IBOPE 2026","c":"5554","t":"IBOPE FLORIANOPOLIS","d":30,"i":"2026-08-28","f":"2026-10-30","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-28"},{"r":150,"g":"IBOPE 2026","s":"IBOPE 2026","c":"5432","t":"IBOPE CRICIUMA","d":30,"i":"2026-08-28","f":"2026-10-30","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-28"},{"r":151,"g":"IBOPE 2026","s":"IBOPE 2026","c":"5293","t":"IBOPE BLUMENAU","d":30,"i":"2026-08-28","f":"2026-10-30","e":"OK","o":"OK","n":"ASSINATURA A TV MAIS QUERIDA DA SUA FAMILIA","x":"2026-08-28"},{"r":154,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5372","t":"CH RATINHO 2025 TVFAM 30","d":30,"n":"Pedir novo off"},{"r":155,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5238","t":"SCC CALHAU ZANOTTO YOUTUBE","d":30,"n":"ASSINATURA 45 ANOS"},{"r":156,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5246","t":"VT SCC SBT INST - INFORMAÇÃO","d":10,"n":"ASSINATURA 45 ANOS"},{"r":157,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5260","t":"VT SCC SBT INST - CULTURA","d":10,"n":"ASSINATURA 45 ANOS"},{"r":158,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5234","t":"VT SCC SBT INST - DIVERSÃO","d":10,"n":"ASSINATURA 45 ANOS"},{"r":159,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5412","t":"VT SCC SBT INST - ESPORTE","d":10,"n":"ASSINATURA 45 ANOS"},{"r":160,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5776","t":"CH IMERSIVA MARIA","d":45},{"r":161,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5189","t":"SCC SPORT CHAMADA 2025","d":30},{"r":162,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5561","t":"CH DOMINGO LEGAL 15","d":15},{"r":163,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5359","t":"CH SILVIO SANTOS COM PATI 15","d":15},{"r":164,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5128","t":"CH FOFOCALIZANDO 15","d":15},{"r":165,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5196","t":"CH A PRAÇA É NOSSA 15","d":15},{"r":166,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5117","t":"CH SBT BRASIL 15","d":15},{"r":167,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","t":"CH SCC MEIO DIA","d":15},{"r":168,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5216","t":"CH RATH 15 INST","d":15},{"r":169,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5067","t":"SCC CALHAU MARICOTINHA YOUTUBE","d":30},{"r":170,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5433","t":"CH - HENRIQUE LAGES MASTER","d":15},{"r":171,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5258","t":"HENRIQUE ZANOTTO-_2 HD","d":10},{"r":172,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5240","t":"CH WEB MOTORS 15","d":15},{"r":173,"g":"PRECISA ATUALIZAR","s":"PRECISA ATUALIZAR","c":"5309","t":"CH FOFOCA 30","d":30},{"r":181,"g":"CHAMADAS EM USO - TA NA HORA SC","s":"CHAMADAS EM USO - TA NA HORA SC","c":"5113","t":"CH JULIA MATTOS 01 HD","d":10,"i":"2026-04-10","f":"2026-07-31","n":"ASSINATURA 45 ANOS","x":"2026-04-10"},{"r":182,"g":"CHAMADAS EM USO - TA NA HORA SC","s":"CHAMADAS EM USO - TA NA HORA SC","c":"5114","t":"CH JULIA MATTOS 02 HD","d":10,"i":"2026-04-10","f":"2026-07-31","n":"ASSINATURA 45 ANOS","x":"2026-04-10"},{"r":183,"g":"CHAMADAS EM USO - TA NA HORA SC","s":"CHAMADAS EM USO - TA NA HORA SC","c":"5507","t":"CH Tá na Hora SC - JULIA E THIAGO","d":30,"i":"2026-04-14","f":"2026-07-31","n":"ASSINATURA 45 ANOS","x":"2026-04-10"},{"r":184,"g":"CHAMADAS EM USO - TA NA HORA SC","s":"CHAMADAS EM USO - TA NA HORA SC","t":"Ch TNH Novo Horário - 2026","d":30,"i":"2026-08-03"},{"r":185,"g":"CHAMADAS EM USO - TA NA HORA SC","s":"CHAMADAS EM USO - TA NA HORA SC","t":"Teaser TNH Novo Horário","d":7,"i":"2026-08-03"},{"r":186,"g":"CHAMADAS EM USO - TA NA HORA SC","s":"CHAMADAS EM USO - TA NA HORA SC","c":"5742","t":"CH TNSC HORARIO NOVO 30S","d":30,"i":"2026-08-03","f":"2026-08-14","n":"Passou do prazo","x":"2026-08-03"},{"r":187,"g":"CHAMADAS EM USO - TA NA HORA SC","s":"CHAMADAS EM USO - TA NA HORA SC","c":"5694","t":"CH TNSC HORARIO NOVO 7S","d":30,"i":"2026-08-03","f":"2026-08-14","n":"Passou do prazo","x":"2026-08-03"},{"r":188,"g":"CHAMADAS EM USO - TA NA HORA SC","s":"CHAMADAS EM USO - TA NA HORA SC","c":"5288","t":"TNSC MARCIA OU PÓS ESTRE 30","d":30,"i":"2026-07-15","f":"2026-08-31"},{"r":189,"g":"CHAMADAS EM USO - TA NA HORA SC","s":"CHAMADAS EM USO - TA NA HORA SC","c":"5257","t":"TA NA HORA MARCIA DU PÓS ESTRE","d":15,"i":"2026-07-20","f":"2026-07-31"},{"r":190,"g":"CHAMADAS EM USO - TA NA HORA SC","s":"CHAMADAS EM USO - TA NA HORA SC","c":"5766","t":"Ch Estreia Marcia Dutra 1","d":30,"i":"2026-07-13","f":"2026-07-19"},{"r":191,"g":"CHAMADAS EM USO - TA NA HORA SC","s":"CHAMADAS EM USO - TA NA HORA SC","c":"5019","t":"Ch Estreia Marcia Dutra 2","d":15,"i":"2026-07-13","f":"2026-07-19"}]'::jsonb) as t(
 r integer,g text,s text,c text,t text,d integer,
 i date,f date,e text,o text,n text,x date
)
on conflict (r) do nothing;

DO $check$
DECLARE total integer; unicos integer; admin_count integer;
BEGIN
  select count(*) into total from private.opec_x_mkt_fonte_20261109;
  select count(*) into unicos from (
    select coalesce(c,'SEM_CODIGO_LINHA_'||r::text)
    from private.opec_x_mkt_fonte_20261109
    group by coalesce(c,'SEM_CODIGO_LINHA_'||r::text)
  ) v;
  select count(*) into admin_count from public.perfis
   where papel='admin' and ativo is true and troca_senha_pendente is false;
  if total <> 164 or unicos <> 161 or admin_count < 1 then
    raise exception 'Falha na verificacao antes da importacao: linhas %, unicos %, admins %',
       total, unicos, admin_count;
  end if;
END
$check$;

-- Respeita seções já existentes, inclusive classificações feitas manualmente.
insert into public.secoes (nome,criado_por)
select distinct st.s, ad.id from private.opec_x_mkt_fonte_20261109 st
cross join lateral (select id from public.perfis
  where papel='admin' and ativo is true and troca_senha_pendente is false
  order by criado_em limit 1) ad
where not exists (
 select 1 from public.secoes se
 where lower(btrim(se.nome)) = lower(btrim(st.s))
);

-- Reúne linhas que pertencem a um mesmo código: títulos alternativos,
-- datas, observações, confirmação de e-mail e OPEC permanecem em JSONB.
create temporary table opec_canon on commit drop as
with agrupado as (
  select
    min(r) as primeira_linha,
    (array_agg(s order by r))[1] as secao,
    (array_agg(c order by r))[1] as codigo,
    (array_agg(t order by r))[1] as titulo,
    (array_agg(d order by r))[1] as duracao,
    string_agg(
      'Linha '||r::text||' ['||g||']: '||
      concat_ws(' | ',
        'Título: '||t,
        case when i is not null then 'Início: '||to_char(i,'DD/MM/YYYY') end,
        case when f is not null then 'Fim: '||to_char(f,'DD/MM/YYYY') end,
        case when e is not null then 'E-mail: '||e end,
        case when o is not null then 'OPEC: '||o end,
        case when n is not null then 'Obs.: '||n end,
        case when x is not null then 'Reenvio: '||to_char(x,'DD/MM/YYYY') end
      ), E'\n' order by r
    ) as observacoes_detalhes,
    jsonb_agg(to_jsonb(st) order by r) as dados_linhas
  from private.opec_x_mkt_fonte_20261109 st
  group by coalesce(c,'SEM_CODIGO_LINHA_'||r::text)
)
select
  primeira_linha,secao,codigo,titulo,duracao,
  left('Fonte: OPEC X MKT (Google Sheets).\n'||observacoes_detalhes,4000) as observacoes,
  jsonb_build_object(
    'planilha_id','1RAS7M_6Z-_A-KAy83KzAnv6iATSIqBVADn0_UBZZALU',
    'nome','OPEC X MKT',
    'linha_primeira',primeira_linha,
    'linhas',dados_linhas
  ) as dados_origem
from agrupado;

-- Registros já existentes com mesmo código/título: preservar a edição atual.
-- Acrescenta apenas informações da planilha sem sobrescrever classificações.
update public.materiais m
set dados_origem=src.dados_origem,
    observacoes=concat_ws(E'\n\n',nullif(m.observacoes,''),src.observacoes)
from opec_canon src
where m.codigo is not null and m.codigo=src.codigo
  and lower(btrim(m.titulo))=lower(btrim(src.titulo))
  and (m.dados_origem->>'planilha_id' is distinct from
    '1RAS7M_6Z-_A-KAy83KzAnv6iATSIqBVADn0_UBZZALU');

-- Importa somente os materiais ainda inexistentes.
-- Sem código/status? Armazena NULL, nada é inventado.
insert into public.materiais (
 secao_id,codigo,titulo,duracao_segundos,status_grade,status_producao,
 link_externo,observacoes,criado_por,dados_origem
)
select sec.id,src.codigo,src.titulo,src.duracao,null,null,null,
 src.observacoes,admin.id,src.dados_origem
from opec_canon src
join public.secoes sec on lower(btrim(sec.nome))=lower(btrim(src.secao))
cross join lateral (
 select id from public.perfis
 where papel='admin' and ativo is true and troca_senha_pendente is false
 order by criado_em limit 1
) admin
where not exists (
  select 1 from public.materiais m
  where (
    src.codigo is not null and m.codigo=src.codigo
    and lower(btrim(m.titulo))=lower(btrim(src.titulo))
  ) or (
    m.dados_origem->>'planilha_id' =
      '1RAS7M_6Z-_A-KAy83KzAnv6iATSIqBVADn0_UBZZALU'
    and m.dados_origem->>'linha_primeira'=src.primeira_linha::text
  )
);

DO $verify$
DECLARE total integer;
BEGIN
  select count(*) into total from public.materiais
  where dados_origem->>'planilha_id'='1RAS7M_6Z-_A-KAy83KzAnv6iATSIqBVADn0_UBZZALU';
  if total <> 161 then
    raise exception 'Importação incompleta: esperado 161 materiais, encontrado %', total;
  end if;
END
$verify$;
COMMIT;

-- Verificação posterior (somente leitura):
select count(*) as registros_vinculados_ao_excel from public.materiais
where dados_origem->>'planilha_id'='1RAS7M_6Z-_A-KAy83KzAnv6iATSIqBVADn0_UBZZALU';