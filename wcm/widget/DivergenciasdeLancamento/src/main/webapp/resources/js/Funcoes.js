Coligadas = [];
Produtos = [];
Departamentos = [];
Filiais = [];
myModal = null;
DataTableDivergencias = null;

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
		Divergencias= Divergencias.map(Divergencia => {
			var Movimento = Movimentos.find(e => e.CODCOLIGADA == Divergencia.CODCOLIGADA && e.IDMOV == Divergencia.IDMOV);
			if (Movimento) {
				Divergencia.OBS_DIVERG = JSON.parse(Divergencia.OBS_DIVERG);

				const { COLIGADA, CODFILIAL, FILIAL, FORNECEDOR, CGCCFO, CODTMV, CODUSUARIO, DATAEMISSAO, VALORBRUTO, OBRA } = Movimento;
				return {
					...Divergencia,
					COLIGADA,
					CODFILIAL,
					FILIAL,
					FORNECEDOR,
					CGCCFO,
					CODTMV,
					CODUSUARIO,
					DATAEMISSAO,
					VALORBRUTO,
					OBRA
				}
			}
			else{
				return null;
			}
		});

		Divergencias = Divergencias.filter(e=> e!=null);

		return Divergencias;
	}

	function AplicaFiltroNasDivergencias(Divergencias, Filtros){
		console.log(Filtros)

		return Divergencias.filter(Divergencia=>{
			if (ValidaFiltros(Divergencia, Filtros)) {
				return true;
			}
			else{
				return false;
			}
		});
	}

	function ValidaFiltros(Divergencia, Filtros){
		if (Filtros.Obra != "Todos" && Filtros.Obra != Divergencia.OBRA) {
			console.log("Obra")
			return false;
		}

		if (Filtros.Usuario != "Todos" && Filtros.Usuario != Divergencia.CODUSUARIO) {
			console.log("Usuario")
			return false;
		}

		if (Filtros.TipoDeMovimento != "Todos" && Filtros.TipoDeMovimento != Divergencia.CODTMV) {
			console.log("TipoDeMovimento")
			return false;
		}

		if ((Filtros.Status == "Ativo" && Divergencia.STATUS != "true") || (Filtros.Status == "Cancelado" && Divergencia.STATUS != false) ) {
			console.log(Filtros.Status, Divergencia.STATUS)

			console.log("STATUS")
			return false;
		}


		console.log(Filtros.Periodo, Filtros.PeriodoInicio.format("YYYY-MM-DD"), Filtros.PeriodoFim.format("YYYY-MM-DD"), Divergencia.DATAEMISSAO.split(" ")[0], Divergencia.CREATEDON)

		if ((Filtros.Periodo == "Emissao" && (Filtros.PeriodoInicio.format("YYYY-MM-DD") > Divergencia.DATAEMISSAO.split(" ")[0] || Filtros.PeriodoFim.format("YYYY-MM-DD") < Divergencia.DATAEMISSAO.split(" ")[0]) ) || (Filtros.Periodo == "Lancamento" && (Filtros.PeriodoInicio.format("YYYY-MM-DD") > Divergencia.CREATEDON || Filtros.PeriodoFim.format("YYYY-MM-DD") < Filtros.CREATEDON) )) {
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
		}
	]

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
	console.log(ds)
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

function NotificaDivergencias(Divergencias) {
	var Notificacoes = [];
	for (const Divergencia of Divergencias) {
		var found = Notificacoes.find(e => e.Usuario == Divergencia.Usuario)

		if (found) {
			found.Divergencias.push(Divergencia)
		}
		else {
			Notificacoes.push({
				Usuario: Divergencia.Usuario,
				Divergencias: [
					Divergencia
				]
			})


		}
	}

	console.log(Notificacoes)
	var html = "";
	for (const Notificacao of Notificacoes) {
		html = "";
		html += "<div>"

		html += "<p>Segue abaixo, divergências referentes ao Relatório de Compromissos Cadastrados/Fundo Fixo.</p>";

		html += "<p>Favor, atenção aos lançamento das notas fiscais no sistema, por gentileza utilizar o relatório de compromissos, como uma ferramenta de conferencia diária, assim, podendo identificar o erro antes que a nota esteja quitada, da declaração ter sido entregue, os relatórios gerenciais gerados para a diretoria e o fechamento contábil.</p>";
		html += "<p>Favor observar as divergências e a correção para a realização dos próximos lançamentos.</p><br/><br/>";

		html += "<div align='center'>"
		html += '<table border="0" cellpadding="2" cellspacing="0" id="bodyTable" border="1">'
		html += "<thead>"
		html += "<tr>"
		html += "<th>Emissão</th>"
		html += "<th>Tipo de Movimento</th>"
		html += "<th>Filial</th>"
		html += "<th>Criação</th>"
		html += "<th>Fornecedor</th>"
		html += "<th>Usuario</th>"
		html += "<th>Correção</th>"
		html += "</tr>"
		html += "</thead>"
		html += "<tbody>"

		for (const DivergenciaNotificacao of Notificacao.Divergencias) {
			html += "<tr>"

			html += "<td>" + DivergenciaNotificacao.Emissao + "</td>"
			html += "<td>" + DivergenciaNotificacao.TipoMovimento + "</td>"
			html += "<td>" + DivergenciaNotificacao.Filial + "</td>"
			html += "<td>" + DivergenciaNotificacao.Criacao + "</td>"
			html += "<td>" + DivergenciaNotificacao.CGCCFO + "<br/>" + DivergenciaNotificacao.Fornecedor + "</td>"
			html += "<td>" + DivergenciaNotificacao.Usuario + "</td>"
			html += "<td>" + DivergenciaNotificacao.Divergencia.CategoriaDivergencia + "</td>"

			html += "</tr>"
		}


		html += "</tbody>"
		html += "</table>"
		html += "</div>"
		html += "<br/><br/>"

		html += "<p>Qualquer dúvida entrar em contato com a Contabilidade, ou acesse o <a href='#'>Painel de Divergências no Fluig</a>.</p>"
		html += "</div>"
	}

	EnviaEmail(html, DivergenciaNotificacao.Usuario);

}

function EnviaEmail(CorpoEmail, usuario) {
	//var url = 'http://fluig.castilho.com.br:1010';//Prod
	var url = 'http://homologacao.castilho.com.br:2020';//Homolog


	var data = {
		//"to": "",
		"to": "gabriel.persike@castilho.com.br",
		//from: "fluig@construtoracastilho.com.br", //Prod
		from: "no-reply@construtoracastilho.com.br", //Homolog
		"subject": "Divergências Contabilidade - " + usuario, //   subject
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
		})
		.fail(function (jqXHR, textStatus, errorThrown) {
			FLUIGC.toast({
				message: 'Erro ao enviar o e-mail.',
				type: 'danger'
			});
			//Falha
		});
}

function AbreModalDetalhes(Divergencia, onCancelarDivergencia) {
	//Abre a Modal
	console.log(Divergencia);
	myModal = FLUIGC.modal({
		title: 'Divergência',
		content: '<div id="rootModalDetalhes"></div>',
		id: 'fluig-modal',
		size: 'full',
		actions: [
			{
				"label": "Cancelar",
				"classType": "btn-danger",
				"bind": "Cancelar-Divergencia"
			}, {
				'label': 'Fechar',
				'autoClose': true
			}
		]
	}, function (err, data) {
		if (err) {
		} else {
			//Apos criar a Modal inicia o <ModalDetalhes/> dentro da Modal
			ReactDOM.render(React.createElement(ModalDetalhes, { Divergencia: Divergencia, onCancelarDivergencia: onCancelarDivergencia }), document.querySelector("#rootModalDetalhes"));
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

function ExecutaDataset(DatasetName, Fields, Constraints, Order, AceitaRetornarVazio = false) {
	return new Promise((resolve, reject) => {
		DatasetFactory.getDataset(DatasetName, Fields, Constraints, Order, {
			success: (ds => {
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

async function UsuarioTemPermissaoGeral(user) {
	try {
		var grupos = await ExecutaDataset("colleagueGroup", null, [
			DatasetFactory.createConstraint("colleagueId", user, user, ConstraintType.MUST),
			DatasetFactory.createConstraint("groupId", "Contabilidade", "Contabilidade", ConstraintType.SHOULD),
			DatasetFactory.createConstraint("groupId", "Administrador TI", "Administrador TI", ConstraintType.SHOULD)
		], null, true);

		if (grupos.length > 0) {
			return true;
		}
	} catch (error) {
		return false;
	}
}

async function BuscaObras() {
	var user = WCMAPI.userCode;
	var permissoes = await ExecutaDataset("BuscaPermissaoColigadasUsuario", null, [
		(await UsuarioTemPermissaoGeral(user) ? 
			DatasetFactory.createConstraint("permissaoGeral", "true", "true", ConstraintType.MUST) : 
			DatasetFactory.createConstraint("usuario", user, user, ConstraintType.MUST)
		)
	], null);

	return 	permissoes.filter(e=> e.CODCOLIGADA == 1).map(({CODCCUSTO, perfil}) => ({CODCCUSTO, perfil}))
}