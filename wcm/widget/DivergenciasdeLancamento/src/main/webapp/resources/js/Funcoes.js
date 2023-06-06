Coligadas = [];
Produtos = [];
Departamentos = [];
Filiais = [];
myModal = null;
DataTableDivergencias = null;
var LoadingEnvioDeEmail = FLUIGC.loading(window);


function BuscaColigadas() {
	//Joga as coligadas na variavel Global Coligadas
	DatasetFactory.getDataset("ColigadasRM", null, [], null, {
		success: (coligadas => {
			for (const coligada of coligadas.values) {
				Coligadas.push({
					CODCOLIGADA: coligada.codcoligada,
					NOME: coligada.nomefantasia,
				});
			}
		}),
		error: (error => {
			FLUIGC.toast({
				title: "Erro ao buscar coligadas: ",
				message: error,
				type: warning
			});
		})
	});
}

function BuscaProdutos(clg) {
	//Joga os produtos na variavel Global Produtos
	DatasetFactory.getDataset("consultaProdutoRM", null, [
		DatasetFactory.createConstraint("clg", clg, clg, ConstraintType.MUST),
		DatasetFactory.createConstraint("tp", 1, 1, ConstraintType.MUST)
	], null, {
		success: (produtos => {
			for (const produto of produtos.values) {
				Produtos.push({
					value: produto.CODIGOPRD + " - " + produto.NOMEFANTASIA
				});
			}
		}),
		error: (error => {
			FLUIGC.toast({
				title: "Erro ao buscar Produtos: ",
				message: error,
				type: warning
			});
		})
	});
}

function BuscaDepartamentos() {
	//Joga os Departamentos na variavel Global Departamentos
	DatasetFactory.getDataset("GDEPTO", null, [
		DatasetFactory.createConstraint("CODCOLIGADA", 1, 1, ConstraintType.MUST),
		DatasetFactory.createConstraint("CODFILIAL", 1, 1, ConstraintType.MUST),
		DatasetFactory.createConstraint("ATIVO", "T", "T", ConstraintType.MUST)
	], null, {
		success: (ds => {
			Departamentos = [];
			for (const departamento of ds.values) {
				Departamentos.push({
					label: departamento.CODDEPARTAMENTO + " - " + departamento.NOME,
					value: departamento.CODDEPARTAMENTO + " - " + departamento.NOME
				});
			}
		})
	});
}

function BuscaFiliais(CODCOLIGADA) {
	//Joga as Filiais na variavel Global Filiais
	DatasetFactory.getDataset("GFILIAL", null, [
		DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST)
	], null, {
		success: (ds => {
			Filiais = [];
			for (const filial of ds.values) {
				Filiais.push({
					CODFILIAL: filial.CODFILIAL,
					FILIAL: filial.NOMEFANTASIA
				});
			}
		})
	});
}

function BuscaMovimentoRM(CODCOLIGADA, IDMOV) {
	return new Promise((resolve, reject) => {
		DatasetFactory.getDataset("BuscaMovimentoDivergencias", null, [
			DatasetFactory.createConstraint("IDMOV", IDMOV, IDMOV, ConstraintType.MUST),
			DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST)
		], null, {
			success: (ds => {
				if (ds.values.length < 1) {
					FLUIGC.toast({
						title: "Nenhum Movimento encontrado!",
						message: "",
						type: "warning"
					});
					reject();
				} else {
					if (ds.values[0][0] == "deu erro!") {
						FLUIGC.toast({
							title: "Erro ao buscar Movimento!",
							message: error,
							type: "warning"
						});
						console.error(ds);
						reject();
					}
					else {
						resolve(ds.values[0])
					}
				}
			}),
			error: (error => {
				FLUIGC.toast({
					title: "Erro ao buscar Movimento!",
					message: error,
					type: "warning"
				});
				console.error(error);
				reject();
			})
		});
	});
}

function BuscaItensMovimentoRM(CODCOLIGADA, IDMOV) {
	return new Promise((resolve, reject) => {
		DatasetFactory.getDataset("BuscaItensMovimentoDivergencias", null, [
			DatasetFactory.createConstraint("IDMOV", IDMOV, IDMOV, ConstraintType.MUST),
			DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST)
		], null, {
			success: (ds => {
				if (ds.values.length < 1) {
					FLUIGC.toast({
						title: "Nenhum Item encontrado!",
						message: "",
						type: "warning"
					});
					reject();
				} else {
					if (ds.values[0][0] == "deu erro!") {
						FLUIGC.toast({
							title: "Erro ao buscar Movimento!",
							message: error,
							type: "warning"
						});
						console.error(ds);
						reject();
					} else {
						resolve(ds.values)
					}
				}
			}),
			error: (error => {
				FLUIGC.toast({
					title: "Erro ao buscar Movimento!",
					message: error,
					type: "warning"
				});
				console.error(error);
				reject();
			})
		});
	});
}

function BuscaDivergencias(Filtros) {
	return new Promise(async (resolve, reject) => {
		try {
			var Divergencias = await BuscaListaDeDivergencias();
			var Movimentos = await BuscaMovimentosDasDivergencias(Divergencias);
			Divergencias = InsereNasDivergenciasAsInformacoesDoMovimento(Divergencias, Movimentos);
			Divergencias = AplicaFiltroNasDivergencias(Divergencias, Filtros);
			console.log(Divergencias)
			resolve(Divergencias);
		} catch (error) {
			console.error(error);
			reject();
		}
	});

	async function BuscaListaDeDivergencias() {
		return await ExecutaDataset("DatasetDivergenciasContabilidade", null, [
			DatasetFactory.createConstraint("Operacao", "BuscaDivergencias", "BuscaDivergencias", ConstraintType.MUST)
		], null);
	}

	async function BuscaMovimentosDasDivergencias(Divergencias) {
		//Extrai CODCOLIGADA e IDMOV das Divergencias
		var ListaDeCODCOLIGADAeIDMOV = Divergencias.map(({ CODCOLIGADA, IDMOV }) => ({ CODCOLIGADA, IDMOV }));
		return await ExecutaDataset("DatasetDivergenciasContabilidade", null, [
			DatasetFactory.createConstraint("Operacao", "BuscaMovimentos", "BuscaMovimentos", ConstraintType.MUST),
			DatasetFactory.createConstraint("Movimentos", JSON.stringify(ListaDeCODCOLIGADAeIDMOV), JSON.stringify(ListaDeCODCOLIGADAeIDMOV), ConstraintType.MUST)
		], null);
	}

	function InsereNasDivergenciasAsInformacoesDoMovimento(Divergencias, Movimentos) {
		Divergencias = Divergencias.map(Divergencia => {
			var Movimento = Movimentos.find(e => e.CODCOLIGADA == Divergencia.CODCOLIGADA && e.IDMOV == Divergencia.IDMOV);
			if (Movimento) {
				Divergencia.OBS_DIVERG = JSON.parse(Divergencia.OBS_DIVERG);

				const { COLIGADA, CODFILIAL, FILIAL, FORNECEDOR, CGCCFO, CODTMV, CODUSUARIO, DATAEMISSAO, VALORBRUTO, OBRA, NUMEROMOV } = Movimento;
				return {
					...Divergencia,
					COLIGADA,
					CODFILIAL,
					FILIAL,
					FORNECEDOR,
					CGCCFO,
					NUMEROMOV,
					CODTMV,
					CODUSUARIO,
					DATAEMISSAO,
					VALORBRUTO,
					OBRA
				}
			}
			else {
				return null;
			}
		});

		Divergencias = Divergencias.filter(e => e != null);

		return Divergencias;
	}

	function AplicaFiltroNasDivergencias(Divergencias, Filtros) {
		return Divergencias.filter(Divergencia => {
			if (ValidaFiltros(Divergencia, Filtros)) {
				return true;
			}
			else {
				return false;
			}
		});
	}

	function ValidaFiltros(Divergencia, Filtros) {
		if (Filtros.Obra != "Todos" && Filtros.Obra != Divergencia.OBRA) {
			return false;
		}

		if (Filtros.Usuario != "Todos" && Filtros.Usuario != Divergencia.CODUSUARIO) {
			return false;
		}

		if (Filtros.TipoDeMovimento != "Todos" && Filtros.TipoDeMovimento != Divergencia.CODTMV) {
			return false;
		}

		if ((Filtros.Status == "Ativo" && Divergencia.STATUS != "true") || (Filtros.Status == "Cancelado" && Divergencia.STATUS != "false")) {
			return false;
		}

		if ((Filtros.Periodo == "Emissao" && (Filtros.PeriodoInicio.format("YYYY-MM-DD") > Divergencia.DATAEMISSAO.split(" ")[0] || Filtros.PeriodoFim.format("YYYY-MM-DD") < Divergencia.DATAEMISSAO.split(" ")[0])) || (Filtros.Periodo == "Lancamento" && (Filtros.PeriodoInicio.format("YYYY-MM-DD") > Divergencia.CREATEDON || Filtros.PeriodoFim.format("YYYY-MM-DD") < Filtros.CREATEDON))) {
			return false;
		}

		if (Filtros.EMAIL_PEND == true && Divergencia.EMAIL_PEND == "false") {
			return false;
		}

		return true;
	}
}

async function BuscaCategoriasDivergencia() {
	var categorias = await ExecutaDataset("DatasetDivergenciasContabilidade", null, [DatasetFactory.createConstraint("Operacao", "BuscaCategoriaDivergencia", "BuscaCategoriaDivergencia", ConstraintType.MUST)], null);
	var options = [];

	for (const Categoria of categorias) {
		options.push({ label: Categoria.DESCRICAO, value: Categoria.ID });
	}

	return options;
}

function BuscaCamposComplementaresCategoriaDivergencia(ID) {
	var ListaCategorias = [
		{
			ID: 1,
			optFields: [
				{ label: "Produto Lançado: ", type: "Produto" },
				{ label: "Produto Correto: ", type: "Produto" }
			]
		},
		{
			ID: 7,
			optFields: [
				{ label: "Número Preenchido no Recibo: ", type: "Text" },
				{ label: "Número Correto: ", type: "Text" }
			]
		},
		{
			ID: 8,
			optFields: [
				{ label: "Data Preenchida no Recibo: ", type: "Date" },
				{ label: "Data Lançada no Sistema: ", type: "Date" }
			]
		},
		{
			ID: 9,
			optFields: [
				{ label: "Nome Preenchido no Recibo: ", type: "Text" },
				{ label: "Nome Correto: ", type: "Text" }
			]
		},
		{
			ID: 10,
			optFields: [
				{ label: "CPF/CNPJ Preenchido no Recibo: ", type: "CPF/CNPJ" },
				{ label: "CPF/CNPJ Lançado: ", type: "CPF/CNPJ" }
			]
		},
		{
			ID: 14,
			optFields: [
				{ label: "Valor Preenchido no Recibo: ", type: "Money" },
				{ label: "Valor Lançado: ", type: "Money" }
			]
		},
		{
			ID: 21,
			optFields: [
				{ label: "Número Lançado: ", type: "Text" },
				{ label: "Número Correto: ", type: "Text" }
			]
		},
		{
			ID: 22,
			optFields: [
				{ label: "CNPJ Lançada: ", type: "CNPJ" },
				{ label: "CNPJ Correta: ", type: "CNPJ" }
			]
		},
		{
			ID: 23,
			optFields: [
				{ label: "Emissão Lançada: ", type: "Date" },
				{ label: "Emissão Correta: ", type: "Date" }
			]
		},
		{
			ID: 24,
			optFields: [
				{ label: "Filial Lançada: ", type: "Filial" },
				{ label: "Filial Correta: ", type: "Filial" }
			]
		},
		{
			ID: 25,
			optFields: [
				{ label: "Série Lançada: ", type: "Text" },
				{ label: "Série Correta: ", type: "Text" }
			]
		},
		{
			ID: 26,
			optFields: [
				{ label: "Tipo de Movimento Lançado: ", type: "Text" },
				{ label: "Tipo de Movimento Correto: ", type: "Text" }
			]
		},
		{
			ID: 28,
			optFields: [
				{ label: "Valor do IRRF Lançado: ", type: "Money" },
				{ label: "Valor do IRRF Correto: ", type: "Money" }
			]
		},
		{
			ID: 29,
			optFields: [
				{ label: "Valor Lançado: ", type: "Money" },
				{ label: "Valor Correto: ", type: "Money" }
			]
		},
		{
			ID: 30,
			optFields: [
				{ label: "Valor do PIS/COFINS/CSLL Lançado: ", type: "Money" },
				{ label: "Valor do PIS/COFINS/CSLL Correto: ", type: "Money" }
			]
		},
		{
			ID: 31,
			optFields: [
				{ label: "Valor do INSS Lançado: ", type: "Money" },
				{ label: "Valor do INSS Correto: ", type: "Money" }
			]
		},
		{
			ID: 36,
			optFields: [
				{ label: "Valor do ISS Lançado: ", type: "Money" },
				{ label: "Valor do ISS Correto: ", type: "Money" }
			]
		},
		{
			ID: 39,
			optFields: [
				{ label: "Quantidade de Folhas Enviadas: ", type: "Text" },
				{ label: "Quantidade de Folhas Totais: ", type: "Text" }
			]
		}
	];

	var found = ListaCategorias.find(e => e.ID == ID);

	if (found) {
		return found.optFields;
	}
	else {
		return [];
	}
}

function CriaGrupoDivergencias(GRUPO, DESCRICAO) {
	var ds = ExecutaDataset("DatasetDivergenciasContabilidade", null, [
		DatasetFactory.createConstraint("Operacao", "InsertCategoriaDivergencia", "InsertCategoriaDivergencia", ConstraintType.MUST),
		DatasetFactory.createConstraint("CategoriaDivergencia", JSON.stringify({ GRUPO: GRUPO, DESCRICAO: DESCRICAO }), JSON.stringify({ GRUPO: GRUPO, DESCRICAO: DESCRICAO }), ConstraintType.MUST),
	], null)
}

function CriaDivergencia(Divergencia) {
	return new Promise(async (resolve, reject) => {
		try {
			//Insere outras colunas que são padrão de todo Insert
			Divergencia.CREATEDON = getDateNowSQL();
			Divergencia.CREATEDBY = WCMAPI.userCode;
			Divergencia.MODIFIEDON = getDateNowSQL();
			Divergencia.MODIFIEDBY = WCMAPI.userCode;
			Divergencia.EMAIL_PEND = 1;
			Divergencia.MOTIVO_CANC = null;
			Divergencia.STATUS = 1;

			await ExecutaDataset("DatasetDivergenciasContabilidade", null, [
				DatasetFactory.createConstraint("Operacao", "InsertDivergencia", "InsertDivergencia", ConstraintType.MUST),
				DatasetFactory.createConstraint("Divergencia", JSON.stringify(Divergencia), JSON.stringify(Divergencia), ConstraintType.MUST)
			], null);

			resolve();
		} catch (error) {
			reject();
		}
	});
}

async function CancelaDivergencia(Divergencia, Motivo) {
	var EMAIL_PEND = Divergencia.EMAIL_PEND;
	if (EMAIL_PEND == "true") {
		//Se o Email estava pendende, então significa que o usuário ainda não foi notificado da Divergencia, por isso não é necessário notificar o cancelamento
		EMAIL_PEND = 0;
	}
	else {
		//Caso o Email já tenha sido enviado, então é necessário notificar o cancelamento da Divergencia
		EMAIL_PEND = 1;
	}

	var CancelamentoDivergencia = {
		ID: Divergencia.ID,
		Motivo: Motivo,
		EMAIL_PEND: EMAIL_PEND,
		MODIFIEDON: getDateNowSQL(),
		MODIFIEDBY: WCMAPI.userCode
	}

	await ExecutaDataset("DatasetDivergenciasContabilidade", null, [
		DatasetFactory.createConstraint("Operacao", "CancelarDivergencia", "CancelarDivergencia", ConstraintType.MUST),
		DatasetFactory.createConstraint("CancelamentoDivergencia", JSON.stringify(CancelamentoDivergencia), JSON.stringify(CancelamentoDivergencia), ConstraintType.MUST)
	], null);
}

async function NotificaDivergencias(Divergencias) {
	LoadingEnvioDeEmail.show()
	for (const Notificacao of Divergencias) {
		var DivegenciasAtivas = "";
		var DivegenciasCanceladas = "";

		for (const Divergencia of Notificacao.Divergencias) {
			var row = ""
			row += "<tr>"
			row += "<td>" + Divergencia.NUMEROMOV + "</td>"
			row += "<td>" + FormataDataParaDDMMYYYY(Divergencia.DATAEMISSAO.split(" ")[0]) + "</td>"
			row += "<td>" + Divergencia.CODTMV + "</td>"
			row += "<td>" + Divergencia.CODFILIAL + "</td>"
			row += "<td>" + FormataDataParaDDMMYYYY(Divergencia.CREATEDON) + "</td>"
			row += "<td>" + Divergencia.CGCCFO + "<br/>" + Divergencia.FORNECEDOR + "</td>"
			row += "<td>" + Divergencia.CATEGORIA + "</td>"
			row += "</tr>"

			if (Divergencia.STATUS == "true") {
				DivegenciasAtivas += row;
			}
			else {
				DivegenciasCanceladas += row;
			}
		}

		var html = "";

		html += "<div>"

		html += "<p>Segue abaixo, divergências referentes ao Relatório de Compromissos Cadastrados do usuário <b>" + Notificacao.CODUSUARIO + "</b>.</p>";
		html += "<p>Favor, atenção aos lançamento das notas fiscais no sistema, por gentileza utilizar o relatório de compromissos, como uma ferramenta de conferencia diária, assim, podendo identificar o erro antes que a nota esteja quitada, da declaração ter sido entregue, os relatórios gerenciais gerados para a diretoria e o fechamento contábil.</p>";
		html += "<p>Favor observar as divergências e a correção para a realização dos próximos lançamentos.</p><br/><br/>";

		if (Notificacao.Observacao != "") {
			html += "<p><b>Observação: </b>" + Notificacao.Observacao + "</p>";
		}

		if (DivegenciasAtivas.length > 0) {
			html += "<h3>Divergências</h3>"
			html += "<div align='center'>"
			html += '<table border="0" cellpadding="2" cellspacing="0" id="bodyTable" border="1" width="100%">'
			html += "<thead>"
			html += "<tr>"
			html += "<th>Numero</th>"
			html += "<th>Emissão</th>"
			html += "<th>Tipo de Movimento</th>"
			html += "<th>Filial</th>"
			html += "<th>Data Divergência</th>"
			html += "<th>Fornecedor</th>"
			html += "<th>Correção</th>"
			html += "</tr>"
			html += "</thead>"
			html += "<tbody>"
			html += DivegenciasAtivas;
			html += "</tbody>"
			html += "</table>"
			html += "</div>"
			html += "<br/><br/>"

		}

		if (DivegenciasCanceladas.length > 0) {
			html += "<h3>Divergências Canceladas</h3>"
			html += "<div align='center'>"
			html += '<table border="0" cellpadding="2" cellspacing="0" id="bodyTable" border="1" width="100%">'
			html += "<thead>"
			html += "<tr>"
			html += "<th>Numero</th>"
			html += "<th>Emissão</th>"
			html += "<th>Tipo de Movimento</th>"
			html += "<th>Filial</th>"
			html += "<th>Data Divergência</th>"
			html += "<th>Fornecedor</th>"
			html += "<th>Correção</th>"
			html += "</tr>"
			html += "</thead>"
			html += "<tbody>"
			html += DivegenciasCanceladas;
			html += "</tbody>"
			html += "</table>"
			html += "</div>"
			html += "<br/><br/>"

		}

		html += "<p>Qualquer dúvida entrar em contato com a Contabilidade.</p>"
		// html += "<p>Qualquer dúvida entrar em contato com a Contabilidade, ou acesse o <a href='#'>Painel de Divergências no Fluig</a>.</p>"
		html += "</div>";
		await EnviaEmail(html, Notificacao.CODUSUARIO, Notificacao.EmailCopia);
		await AlteraStatusEmailParaEnviado(Notificacao.Divergencias);
	}

	LoadingEnvioDeEmail.hide();
}


async function AlteraStatusEmailParaEnviado(Divergencias) {
	for (const Divergencia of Divergencias) {
		await ExecutaDataset("DatasetDivergenciasContabilidade", null, [
			DatasetFactory.createConstraint("Operacao", "AlteraStatusEmailParaEnviado", "AlteraStatusEmailParaEnviado", ConstraintType.MUST),
			DatasetFactory.createConstraint("ID", Divergencia.ID, Divergencia.ID, ConstraintType.MUST)
		], null);
	}
}

function EnviaEmail(CorpoEmail, usuario, emails) {
	return new Promise((resolve, reject) => {
		var url = 'http://fluig.castilho.com.br:1010';//Prod
		// var url = 'http://homologacao.castilho.com.br:2020';//Homolog


		var data = {
			"to": emails,
			// "to": "gabriel.persike@castilho.com.br",
			from: "fluig@construtoracastilho.com.br", //Prod
			// from: "no-reply@construtoracastilho.com.br", //Homolog
			"subject": usuario + " - Divergências Contabilidade", //   subject
			"templateId": "TPL_PADRAO_CASTILHO", // Email template Id previously registered
			"dialectId": "pt_BR", //Email dialect , if not informed receives pt_BR , email dialect ("pt_BR", "en_US", "es")
			"param": {
				"CORPO_EMAIL": CorpoEmail,
				"SERVER_URL": url,
				"TENANT_ID": "1"
			}
		};

		$.ajax({
			url: "/api/public/alert/customEmailSender",
			type: "POST",
			contentType: "application/json",
			data: JSON.stringify(data)
		})
			.done(function (data) {
				FLUIGC.toast({
					title: "E-mail enviado com exito!",
					message: "",
					type: "warning"
				});
				resolve();
			})
			.fail(function (jqXHR, textStatus, errorThrown) {
				FLUIGC.toast({
					message: 'Erro ao enviar o e-mail.',
					type: 'danger'
				});
				//Falha
			});

	})

}

function AbreModalDetalhes(Divergencia, onBuscaDivergencias) {
	//Abre a Modal
	var actions = [];
	if (Divergencia.STATUS != "false") {
		actions.push({
			"label": "Cancelar",
			"classType": "btn-danger",
			"bind": "Cancelar-Divergencia"
		});
	}
	actions.push({
		'label': 'Fechar',
		'autoClose': true
	});

	myModal = FLUIGC.modal({
		title: 'Divergência',
		content: '<div id="rootModalDetalhes"></div>',
		id: 'fluig-modal',
		size: 'full',
		actions: actions
	}, function (err, data) {
		if (err) {
		} else {
			//Apos criar a Modal inicia o <ModalDetalhes/> dentro da Modal
			ReactDOM.render(React.createElement(ModalDetalhes, { Divergencia: Divergencia, onBuscaDivergencias: onBuscaDivergencias }), document.querySelector("#rootModalDetalhes"));
		}
	});
}


// UTILS
function makeid(length) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() *
			charactersLength));
	}
	return result;
}

function validarCNPJ(cnpj) {
	cnpj = cnpj.replace(/[^\d]+/g, "");
	if (cnpj == "") return false;

	if (cnpj.length != 14) return false;

	// Elimina CNPJs invalidos conhecidos
	if (cnpj == "00000000000000" || cnpj == "11111111111111" || cnpj == "22222222222222" || cnpj == "33333333333333" || cnpj == "44444444444444" || cnpj == "55555555555555" || cnpj == "66666666666666" || cnpj == "77777777777777" || cnpj == "88888888888888" || cnpj == "99999999999999") return false;

	// Valida DVs
	tamanho = cnpj.length - 2;
	numeros = cnpj.substring(0, tamanho);
	digitos = cnpj.substring(tamanho);
	soma = 0;
	pos = tamanho - 7;
	for (i = tamanho; i >= 1; i--) {
		soma += numeros.charAt(tamanho - i) * pos--;
		if (pos < 2) pos = 9;
	}
	resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
	if (resultado != digitos.charAt(0)) return false;

	tamanho = tamanho + 1;
	numeros = cnpj.substring(0, tamanho);
	soma = 0;
	pos = tamanho - 7;
	for (i = tamanho; i >= 1; i--) {
		soma += numeros.charAt(tamanho - i) * pos--;
		if (pos < 2) pos = 9;
	}
	resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
	if (resultado != digitos.charAt(1)) return false;

	return true;
}

function validaCPF(separacpf) {
	// Verificado em 18/05/2017 conforme: http://www.receita.fazenda.gov.br/aplicacoes/atcta/cpf/funcoes.js
	// 0: válido; 1: inválido
	separacpf = separacpf.replace(/[^\d]+/g, "");

	var retorno = 0;
	var num1 = separacpf[0];
	var num2 = separacpf[1];
	var num3 = separacpf[2];
	var num4 = separacpf[3];
	var num5 = separacpf[4];
	var num6 = separacpf[5];
	var num7 = separacpf[6];
	var num8 = separacpf[7];
	var num9 = separacpf[8];
	var num10 = separacpf[9];
	var num11 = separacpf[10];
	if (num1 == num2 && num2 == num3 && num3 == num4 && num4 == num5 && num5 == num6 && num6 == num7 && num7 == num8 && num8 == num9 && num9 == num10) {
		return false;
	} else {
		var soma1 = num1 * 10 + num2 * 9 + num3 * 8 + num4 * 7 + num5 * 6 + num6 * 5 + num7 * 4 + num8 * 3 + num9 * 2;
		var resto1 = (soma1 * 10) % 11;
		if (resto1 == 10 || resto1 == 11) {
			resto1 = 0;
		}
		if (num10 != resto1) {
			return false;
		} else {
			var soma2 = num1 * 11 + num2 * 10 + num3 * 9 + num4 * 8 + num5 * 7 + num6 * 6 + num7 * 5 + num8 * 4 + num9 * 3 + num10 * 2;
			var resto2 = (soma2 * 10) % 11;
			if (resto2 == 10 || resto2 == 11) {
				resto2 = 0;
			}
			if (num11 != resto2) {
				return false;
			}
		}
	}
	return true;
}

function getDateNow() {
	var date = new Date();

	var day = date.getDate().toString().padStart(2, "0");
	var month = (date.getMonth() + 1).toString().padStart(2, "0");
	var year = date.getFullYear();

	return day + "/" + month + "/" + year;
}

function getDateNowSQL() {
	const date = new Date();
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');

	return `${year}-${month}-${day}`;
}

function FormataDataParaDDMMYYYY(data) {
	data = data.split(" ")[0];
	data = data.split("-").reverse().join("/");
	return data;
}

function ExecutaDataset(DatasetName, Fields, Constraints, Order, AceitaRetornarVazio = false) {
	return new Promise((resolve, reject) => {
		DatasetFactory.getDataset(DatasetName, Fields, Constraints, Order, {
			success: (ds => {
				try {
					if (!ds || !ds.values || (ds.values.length == 0 && !AceitaRetornarVazio) || (ds.values[0][0] == "deu erro! " && ds.values[0][1] != "com.microsoft.sqlserver.jdbc.SQLServerException: A instrução não retornou um conjunto de resultados.")) {
						console.error("Erro ao executar o Dataset: " + DatasetName);
						console.error(ds);
						FLUIGC.toast({
							title: "Erro ao executar o Dataset: " + DatasetName,
							message: "",
							type: "warning"
						});
						reject();
					}
					else {
						resolve(ds.values);
					}
				} catch (error) {
					console.error(error);

					reject();
				}

			}),
			error: (e => {
				console.error("Erro ao executar o Dataset: " + DatasetName);
				console.error(e);
				FLUIGC.toast({
					title: "Erro ao executar o Dataset: " + DatasetName,
					message: "",
					type: "warning"
				});
				reject();
			})
		})
	});
}

async function BuscaTodasObras() {
	var permissoes = await ExecutaDataset("BuscaPermissaoColigadasUsuario", null, [
		DatasetFactory.createConstraint("permissaoGeral", "true", "true", ConstraintType.MUST)
	], null);

	return permissoes.filter(e => e.CODCOLIGADA == 1).map(({ CODCCUSTO, perfil }) => ({ CODCCUSTO, perfil }))
}

function BuscaEmailUsuario(usuario) {
	var ds = DatasetFactory.getDataset("colleague", null, [DatasetFactory.createConstraint("colleagueId", usuario, usuario, ConstraintType.MUST)], null);

	if (ds.values.length > 0) {
		return ds.values[0]["mail"];
	}
	else {
		return "";
	}
}

async function BuscaChefeDeEscritorioDoGrupo(groupId) {
	var Usuarios = await ExecutaDataset("colleagueGroup", null, [
		DatasetFactory.createConstraint("groupId", groupId, groupId, ConstraintType.MUST)
	], null);

	var Chefes = await ExecutaDataset("colleagueGroup", null, [
		DatasetFactory.createConstraint("groupId", "Chefes de Escritório", "Chefes de Escritório", ConstraintType.MUST)
	], null);

	Usuarios = Usuarios.filter(Usuario => {
		return Chefes.some(Chefe => Usuario["colleagueGroupPK.colleagueId"] == Chefe["colleagueGroupPK.colleagueId"]);
	});

	return Usuarios;
}

function validaEmail(email) {
	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailPattern.test(email);
}

function validaGrupo(usuario, grupos) {//Verifica se o usuario faz parte dos grupos
	var constraints = [DatasetFactory.createConstraint("colleagueId", usuario, usuario, ConstraintType.MUST)];
	for (var i = 0; i < grupos.length; i++) {
		constraints.push(DatasetFactory.createConstraint("groupId", grupos[i], grupos[i], ConstraintType.SHOULD));
	}

	var ds = DatasetFactory.getDataset("colleagueGroup", null, constraints, null);

	if (ds.values.length > 0) {
		return ds.values[0]["colleagueGroupPK.groupId"];
	} else {
		return false;
	}
}

async function VerificaPermissoesDoUsuario(user) {
	if (validaGrupo(user, ["Contabilidade", "Administrador TI"])) {
		return { Permissao: "Geral" };
	}
	else if (user == "rodrigo.ramos") {
		return { Permissao: "Visualizacao" };
	}
	else if (validaGrupo(user, ["Chefes de Escritório"])) {
		var Obras = await ExecutaDataset("colleagueGroup", null, [
			DatasetFactory.createConstraint("colleagueId", user, user, ConstraintType.MUST),
			DatasetFactory.createConstraint("groupId", "Obra%", "Obra%", ConstraintType.MUST, true)
		], null);

		Obras = Obras.map((e) => e["colleagueGroupPK.groupId"]);
		console.log(Obras)
		return { Permissao: "VisualizacaoObra", Obras: Obras }
	}
	else {
		return { Permissao: "VisualizacaoUsuario" };
	}
}

function BuscaEpoch(date){
	date = new Date(date);
	return date.getTime()
}

function TraduzMes(value){
	value = new Date(value)
	var mes = value.toLocaleString("pt-BR", {month:"short"}).replace(".","")
	return mes + "/" + value.getFullYear();
}


