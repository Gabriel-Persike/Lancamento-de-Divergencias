class InformacoesIniciais extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            Divergencias: [],
            DivergenciasCanceladas: [],
            MostraDivergenciasAtivas: true
        };
    }

    handleLancamentoDivergencia(divergencia) {
        var Divergencias = this.state.Divergencias.slice();
        Divergencias.push(divergencia);
        this.setState(
            {
                Divergencias: Divergencias
            },
            () => {}
        );
    }

    handleCancelarDivergencia(id, Motivo) {
        console.log("handleCancelarDivergencia: " + id);

        var Divergencias = this.state.Divergencias.slice();

        var found = Divergencias.find((obj) => obj.ID == id);

        if (found) {
            Divergencias = Divergencias.filter((obj) => obj.ID != id);
            var DivergenciasCanceladas = this.state.DivergenciasCanceladas.slice();
            found.status = "Cancelado";
            found.MotivoCancelamento = Motivo;
            DivergenciasCanceladas.push(found);

            this.setState(
                {
                    Divergencias: Divergencias,
                    DivergenciasCanceladas: DivergenciasCanceladas
                },
                () => {
                    FLUIGC.toast({
                        title: "Divergência Cancelada!",
                        message: "",
                        type: "warning"
                    });
                }
            );
        }
    }

    render() {
        return (
            <ErrorBoundary>
                <div id="divCollapse">
                    <ul id="coltabs" className="nav nav-tabs nav-justified nav-pills" role="tablist" style={{ paddingBottom: "0px", width: "100%" }}>
                        <li className="collapse-tab active">
                            <a href="#tabInformacoesIniciais" role="tab" id="atabInformacoesIniciais" data-toggle="tab" aria-expanded="true" className="tab">
                                Lançar Divergência
                            </a>
                        </li>
                        <li className="collapse-tab">
                            <a href="#tabItens" role="tab" id="atabItens" data-toggle="tab" aria-expanded="true" className="tab">
                                Lista de Divergências
                            </a>
                        </li>
                    </ul>
                    <div className="tab-content">
                        <div className="tab-pane active" id="tabInformacoesIniciais">
                            <Lancamento onLancamentoDivergencia={(e) => this.handleLancamentoDivergencia(e)} />
                        </div>
                        <div className="tab-pane" id="tabItens">
                            <Panel title="Filtro">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        this.setState({ MostraDivergenciasAtivas: !this.state.MostraDivergenciasAtivas });
                                    }}
                                >
                                    ChangeView
                                </button>

                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        NotificaDivergencias(this.state.Divergencias)
                                    }}
                                >
                                    Notificar Divergências
                                </button>

                            </Panel>

                            <ListaDivergencias Divergencias={this.state.MostraDivergenciasAtivas == true ? this.state.Divergencias : this.state.DivergenciasCanceladas} onCancelarDivergencia={(ID, Motivo) => this.handleCancelarDivergencia(ID, Motivo)} />
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        );
    }
}

class LinhaDivergencia extends React.Component {
    render() {
        console.log(this.props.Divergencia);

        var divergencia = this.props.Divergencia.Divergencia;
        divergencia = <b>{divergencia.CategoriaDivergencia}</b>;

        return (
            <tr>
                <td>{this.props.Divergencia.Emissao}</td>
                {/* <td>{this.props.Divergencia.Identificador}</td> */}
                <td>{this.props.Divergencia.TipoMovimento}</td>
                <td>{this.props.Divergencia.Filial}</td>
                <td>{this.props.Divergencia.Criacao}</td>
                <td>
                    {this.props.Divergencia.CGCCFO} <br /> {this.props.Divergencia.Fornecedor}
                </td>
                <td>{this.props.Divergencia.Usuario}</td>
                <td>{divergencia}</td>
                <td style={{ textAlign: "center" }}>
                    {this.props.Divergencia.status == "Cancelado" ? (
                        <button className={"btn btn-danger bs-docs-popover-hover"} onClick={() => AbreModalDetalhes(this.props.Divergencia, this.props.onCancelarDivergencia)} data-toggle={"popover"} data-content={this.props.Divergencia.MotivoCancelamento}>
                            Detalhes
                        </button>
                    ) : (
                        <button className={"btn btn-primary"} onClick={() => AbreModalDetalhes(this.props.Divergencia, this.props.onCancelarDivergencia)}>
                            Detalhes
                        </button>
                    )}
                </td>
            </tr>
        );
    }
}

class ListaDivergencias extends React.Component {
    renderDivergencias() {
        var Divergencias = this.props.Divergencias;
        console.log(Divergencias);
    }

    componentDidUpdate() {
        DataTableDivergencias.clear();
        DataTableDivergencias.rows.add(this.props.Divergencias); // Add new data
        setTimeout(() => {
            DataTableDivergencias.columns.adjust().draw();
        }, 200);

        DataTableDivergencias.on("draw", { onCancelarDivergencia: this.props.onCancelarDivergencia }, (event) => {
            FLUIGC.popover(".bs-docs-popover-hover", { trigger: "hover", placement: "auto" });

            $(".btnShowDetails").off("click");
            $(".btnShowDetails").on("click", { onCancelarDivergencia: event.data.onCancelarDivergencia }, function (event) {
                var tr = $(this).closest("tr");
                var row = DataTableDivergencias.row(tr);
                var values = row.data();
                AbreModalDetalhes(values, event.data.onCancelarDivergencia);
            });
        });
    }

    componentDidMount() {
        DataTableDivergencias = $("#TableDivergencias").DataTable({
            pageLength: 25,
            columns: [
                { data: "Emissao" },
                { data: "TipoMovimento" },
                { data: "Filial" },
                { data: "Criacao" },
                {
                    render: function (data, type, row) {
                        return "<span>" + row.CGCCFO + " <br /> " + row.Fornecedor + "</span>";
                    }
                },
                { data: "Usuario" },
                {
                    data: "Divergencia",
                    render: function (data, type, row) {
                        return data.CategoriaDivergencia;
                    }
                },
                {
                    render: function (data, type, row) {
                        if (row.status == "Cancelado") {
                            return "<div style='text-align:center'><button class='btn btn-danger btnShowDetails bs-docs-popover-hover' data-toggle='popover' data-content='" + row.MotivoCancelamento + "' >Detalhes</button></div>";
                        } else {
                            return "<div style='text-align:center'><button class='btn btn-primary btnShowDetails'>Detalhes</button></div>";
                        }
                    }
                }
            ],
            language: {
                sEmptyTable: "Nenhum registro encontrado",
                sInfo: "Mostrando de _START_ até _END_ de _TOTAL_ registros",
                sInfoEmpty: "Mostrando 0 até 0 de 0 registros",
                sInfoFiltered: "(Filtrados de _MAX_ registros)",
                sInfoPostFix: "",
                sInfoThousands: ".",
                sLengthMenu: "_MENU_ resultados por página",
                sLoadingRecords: "Carregando...",
                sProcessing: "Processando...",
                sZeroRecords: "Nenhum registro encontrado",
                sSearch: "Pesquisar",
                oPaginate: {
                    sNext: "Próximo",
                    sPrevious: "Anterior",
                    sFirst: "Primeiro",
                    sLast: "Último"
                },
                oAria: {
                    sSortAscending: ": Ordenar colunas de forma ascendente",
                    sSortDescending: ": Ordenar colunas de forma descendente"
                },
                select: {
                    rows: {
                        _: "Selecionado %d linhas",
                        0: "Nenhuma linha selecionada",
                        1: "Selecionado 1 linha"
                    }
                },
                buttons: {
                    copy: "Copiar para a área de transferência",
                    copyTitle: "Cópia bem sucedida",
                    copySuccess: {
                        1: "Uma linha copiada com sucesso",
                        _: "%d linhas copiadas com sucesso"
                    }
                }
            }
        });
    }

    render() {
        return (
            <div className="panel panel-primary">
                <div className="panel-heading">
                    <h3 className="panel-title">Divergências/Correções</h3>
                </div>
                <div className="panel-body">
                    <table className="table table-bordered table-striped" id="TableDivergencias" style={{ width: "100%" }}>
                        <thead>
                            <tr>
                                <th>Emissão</th>
                                {/* <th>Identificador</th> */}
                                <th>T.M.</th>
                                <th>Filial</th>
                                <th>Criação</th>
                                <th>Fornecedor</th>
                                <th>Usuário</th>
                                <th>Correção</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        );
    }
}

function Item({ ItemIndex, CodigoProduto, Produto, Quantidade, ValorUnit, CODUND }) {
    return (
        <tr>
            <td>
                <span>{ItemIndex + 1}</span>
            </td>
            <td>
                <span>{CodigoProduto + " - " + Produto}</span>
            </td>
            <td>
                <MoneySpan text={Quantidade + CODUND} />
            </td>
            <td>
                <MoneySpan text={"R$ " + ValorUnit} />
            </td>
            <td>
                <MoneySpan text={"R$ " + (Quantidade * ValorUnit).toFixed(2).toString()} />
            </td>
        </tr>
    );
}

class Lancamento extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            CategoriaDivergencia: "",
            ObservacaoDivergencia: "",
            Movimento: {
                Coligada: "",
                IDMOV: "",
                Filial: "",
                Fornecedor: "",
                CGCCFO: "",
                CODTMV: "",
                ValorTotal: "",
                DataEmissao: "",
                DataCriacao: "",
                NumeroMov: "",
                Serie: "",
                Usuario: ""
            },
            Itens: []
        };
    }

    handleChangeCategoriaDivergencia(e) {
        this.setState({
            CategoriaDivergencia: e
        });
    }

    handleChangeParametrosDivergencia(parametro, valor) {
        this.setState({
            [parametro]: valor
        });
    }

    validaLancamentoDivergencia() {
        if (!this.state.Movimento.Coligada || !this.state.Movimento.IDMOV) {
            FLUIGC.toast({
                title: "Nenhum Movimento Selecionado!",
                message: "",
                type: "warning"
            });
            return false;
        } else if (!this.state.CategoriaDivergencia) {
            FLUIGC.toast({
                title: "Nenhuma Categoria de Divergência Selecionada!",
                message: "",
                type: "warning"
            });
            return false;
        } else {
            var optionFound = this.buscaInfosCategoriaDivergenciaSelecionada();

            if (optionFound) {
                for (const field of optionFound) {
                    if (!this.state[field.label]) {
                        FLUIGC.toast({
                            title: field.label + " não preenchido!",
                            message: "",
                            type: "warning"
                        });
                        return false;
                    }
                }
            }
        }

        return true;
    }

    buscaInfosCategoriaDivergenciaSelecionada() {
        var options = this.renderOptionsCategoriaDivergencia();
        var optionFound = options.reduce((acc, optGroup) => {
            //Busca os optFields da CategoriaDivergencia Selecionada
            var foundOption = optGroup.options.find((option) => option.value == this.state.CategoriaDivergencia);
            if (foundOption) {
                acc = foundOption.optFields;
            }
            return acc;
        }, null);

        return optionFound;
    }

    lancarDivergencia() {
        if (this.validaLancamentoDivergencia()) {
            var Movimento = this.state.Movimento;
            var CategoriaSelecionada = this.state.CategoriaDivergencia;

            var optionFound = this.buscaInfosCategoriaDivergenciaSelecionada();
            var CamposCategoria = [];
            if (optionFound) {
                //Cria lista com as informações adicionais da CategoriaDivergencia
                for (const field of optionFound) {
                    CamposCategoria.push({
                        label: field.label,
                        value: this.state[field.label]
                    });
                }
            }

            var Divergencia = {
                ID: makeid(6),
                Coligada: Movimento.Coligada,
                Identificador: Movimento.IDMOV,
                Emissao: Movimento.DataEmissao,
                TipoMovimento: Movimento.CODTMV,
                Filial: Movimento.Filial,
                Criacao: getDateNow(),
                Fornecedor: Movimento.Fornecedor,
                CGCCFO: Movimento.CGCCFO,
                Usuario: Movimento.Usuario,
                Divergencia: {
                    CategoriaDivergencia: CategoriaSelecionada,
                    CamposCategoria: CamposCategoria,
                    ObservacaoDivergencia: this.state.ObservacaoDivergencia
                }
            };
            this.props.onLancamentoDivergencia(Divergencia);

            this.setState({
                Movimento: {
                    Coligada: "",
                    Filial: "",
                    Fornecedor: "",
                    CGCCFO: "",
                    CODTMV: "",
                    ValorTotal: "",
                    DataEmissao: "",
                    Usuario: ""
                },
                Itens: [],
                CategoriaDivergencia: "",
                ObservacaoDivergencia: ""
            });
            FLUIGC.toast({
                title: "Divergência Lançada!!",
                message: "",
                type: "success"
            });
        }
    }

    handleBuscaMovimento(movimento, itens) {
        this.setState({
            Movimento: movimento,
            Itens: itens
        });
    }

    renderOptionsCategoriaDivergencia() {
        var options = [
            {
                label: "Produto", //optGroup
                options: [
                    {
                        label: "Produto no Carimbo Incorreto",
                        value: "Produto no Carimbo Incorreto",
                        optFields: [
                            { label: "Produto Lançado", type: "Produto" },
                            { label: "Produto Correto", type: "Produto" }
                        ]
                    },
                    {
                        label: "Produto no Sistema Incorreto",
                        value: "Produto no Sistema Incorreto",
                        optFields: [
                            { label: "Produto Lançado", type: "Produto" },
                            { label: "Produto Correto", type: "Produto" }
                        ]
                    },
                    { label: "Carimbo sem Descrição do Produto", value: "Carimbo sem Descrição do Produto" }
                ]
            },
            {
                label: "Itens", //optGroup
                options: [
                    {
                        label: "Descrição Incompleta",
                        value: "Descrição Incompleta"
                    },
                    {
                        label: "Os Itens não estão Lançados Separadamente",
                        value: "Os Itens não estão Lançados Separadamente"
                    },
                    {
                        label: "Produto/Classificação Financeira",
                        value: "Produto/Classificação Financeira",
                        optFields: [
                            { label: "Lançado: ", type: "Produto" },
                            { label: "Correto: ", type: "Produto" }
                        ]
                    }
                ]
            },
            {
                label: "Lançamento", //optGroup
                options: [
                    {
                        label: "Documento Lançado na Filial Incorreta",
                        value: "Documento Lançado na Filial Incorreta",
                        optFields: [
                            { label: "Filial Incorreta", type: "Filial" },
                            { label: "Filial Correta", type: "Filial" }
                        ]
                    },
                    {
                        label: "Lançamento no Fornecedor Incorreto",
                        value: "Lançamento no Fornecedor Incorreto",
                        optFields: [
                            { label: "CNPJ Lançado: ", type: "CPF/CNPJ" },
                            { label: "CNPJ Correto: ", type: "CPF/CNPJ" }
                        ]
                    },
                    {
                        label: "Emissão Lançada no Sistema",
                        value: "Emissão Lançada no Sistema",
                        optFields: [
                            { label: "Emissão Lançada: ", type: "date" },
                            { label: "Emissão Correta: ", type: "date" }
                        ]
                    },
                    {
                        label: "Nº do Documento Lançado no Sistema",
                        value: "Nº do Documento Lançado no Sistema",
                        optFields: [
                            { label: "Nº do Documento Lançado: ", type: "text" },
                            { label: "Nº do Documento Correto: ", type: "text" }
                        ]
                    },
                    {
                        label: "Série da Nota Fiscal Lançada no Sistema",
                        value: "Série da Nota Fiscal Lançada no Sistema",
                        optFields: [
                            { label: "Série da Nota Fiscal Lançada: ", type: "text" },
                            { label: "Série da Nota Fiscal Correta: ", type: "text" }
                        ]
                    },
                    {
                        label: "Local da Prestação do Serviço Preenchido Incorretamente no Sistema",
                        value: "Local da Prestação do Serviço Preenchido Incorretamente no Sistema"
                    },
                    {
                        label: "Valor Lançado no Sistema",
                        value: "Valor Lançado no Sistema",
                        optFields: [
                            { label: "Valor Lançado: ", type: "valor" },
                            { label: "Valor Correto: ", type: "valor" }
                        ]
                    }
                ]
            },
            {
                label: "Carimbo", //optGroup
                options: [
                    { label: "Carimbo Incompleto", value: "Carimbo Incompleto" },
                    { label: "Carimbo em Branco", value: "Carimbo em Branco" },
                    { label: "NF/Recibo/Guia sem Carimbo", value: "NF/Recibo/Guia sem Carimbo" },
                    { label: "Sem Sub-Empreiteiro Próximo ao Carimbo", value: "Sem Sub-Empreiteiro Próximo ao Carimbo" },
                    { label: "Sem Prefixo do Equipamento Próximo ao Carimbo", value: "Sem Prefixo do Equipamento Próximo ao Carimbo" },
                    { label: "Departamento no Carimbo Divergente com o Lançado no Sistema", value: "Departamento no Carimbo Divergente com o Lançado no Sistema" },
                    { label: "Centro de Custo no Carimbo Divergente com o Lançado no Sistema", value: "Centro de Custo no Carimbo Divergente com o Lançado no Sistema" },
                    { label: "Carimbo sem a Descrição do Departamento", value: "Carimbo sem a Descrição do Departamento" },
                    { label: "Carimbo sem a Descrição do Centro de Custo", value: "Carimbo sem a Descrição do Centro de Custo" },
                    {
                        label: "No Carimbo/Sistema o Departamento não faz Sentido com a Descrição do Produto",
                        value: "No Carimbo/Sistema o Departamento não faz Sentido com a Descrição do Produto",
                        optFields: [
                            { label: "Produto", type: "Produto" },
                            { label: "Departamento", type: "Departamento" }
                        ]
                    }
                ]
            },
            {
                label: "Tipo de Movimento", //optGroup
                options: [
                    { label: "Devido a Nnatureza da Operação a NF não Deveria ter sido Lançada Neste Tipo de Movimento", value: "Devido a Nnatureza da Operação a NF não Deveria ter sido Lançada Neste Tipo de Movimento" },
                    {
                        label: "Documento Lançado no Tipo de Movimento Incorreto",
                        value: "Documento Lançado no Tipo de Movimento Incorreto",
                        optFields: [
                            { label: "Tipo de Movimento Lançado: ", type: "text" },
                            { label: "Tipo de Movimento Correto: ", type: "text" }
                        ]
                    }
                ]
            },
            {
                label: "Coligada", //optGroup
                options: [
                    { label: "Despesa Devida no Consórcio e Lançada na Castilho", value: "Despesa Devida no Consórcio e Lançada na Castilho" },
                    { label: "Despesa Devida na Castilho e Lançada no Consórcio", value: "Despesa Devida na Castilho e Lançada no Consórcio" }
                ]
            },
            {
                label: "Nota Fiscal", //optGroup
                options: [
                    { label: "Nota Fiscal de Serviço Pessoa Fisica", value: "Nota Fiscal de Serviço Pessoa Fisica" },
                    { label: "Ausência do CNPJ na Nota Fiscal/Recibo de Aluguel", value: "Ausência do CNPJ na Nota Fiscal/Recibo de Aluguel" },
                    { label: "Nota Fiscal sem Emissão", value: "Nota Fiscal sem Emissão" },
                    { label: "Ausência dos Dados da Castilho na Nota Fiscal/Cupom", value: "Ausência dos Dados da Castilho na Nota Fiscal/Cupom" },
                    { label: "Nota Fiscal/Cupom não Possui Carimbo", value: "Nota Fiscal/Cupom não Possui Carimbo" },
                    { label: "NF/Recibo/Guia/Cupom sem Assinatura do Chefe de Escritório e Engenheiro", value: "NF/Recibo/Guia/Cupom sem Assinatura do Chefe de Escritório e Engenheiro" }
                ]
            },
            {
                label: "Aluguel", //optGroup
                options: [
                    { label: "Período do Recibo de Aluguel", value: "Período do Recibo de Aluguel" },
                    { label: "Recibo de Aluguel sem CPF do Locador", value: "Recibo de Aluguel sem CPF do Locador" },
                    {
                        label: "CPF/CNPJ no Recibo de Aluguel Divergente do Lançado no Sistema",
                        value: "CPF/CNPJ no Recibo de Aluguel Divergente do Lançado no Sistema",
                        optFields: [
                            { label: "CPF/CNPJ Lançado: ", type: "CPF/CNPJ" },
                            { label: "CPF/CNPJ no Recibo: ", type: "CPF/CNPJ" }
                        ]
                    },
                    { label: "Nome do Locador no Recibo de Aluguel está Incorreto", value: "Nome do Locador no Recibo de Aluguel está Incorreto" },
                    {
                        label: "Nº no Recibo de Aluguel Divergente do Lançado no Sistema",
                        value: "Nº no Recibo de Aluguel Divergente do Lançado no Sistema",
                        optFields: [
                            { label: "Nº Lançado: ", type: "text" },
                            { label: "Nº no Recibo: ", type: "text" }
                        ]
                    },
                    {
                        label: "Emissão no Recibo de Aluguel Divergente da Lançado no Sistema",
                        value: "Emissão no Recibo de Aluguel Divergente da Lançado no Sistema",
                        optFields: [
                            { label: "Emissão Lançada: ", type: "date" },
                            { label: "Emissão no Recibo: ", type: "date" }
                        ]
                    },
                    {
                        label: "Valor no Recibo de Aluguel Divergente do Lançado no Sistema",
                        value: "Valor no Recibo de Aluguel Divergente do Lançado no Sistema",
                        optFields: [
                            { label: "Valor Lançado: ", type: "valor" },
                            { label: "Valor no Recibo: ", type: "valor" }
                        ]
                    },
                    {
                        label: "Recibo de Aluguel sem o Valor do IPTU",
                        value: "Recibo de Aluguel sem o Valor do IPTU"
                    },
                    {
                        label: "Valor por Extenso no Recibo de Aluguel está Incorreto",
                        value: "Valor por Extenso no Recibo de Aluguel está Incorreto"
                    },
                    {
                        label: "Recibo de Aluguel sem o Valor do IRRF",
                        value: "Recibo de Aluguel sem o Valor do IRRF"
                    },
                    {
                        label: "Recibo de Aluguel de Pessoa Jurídica com Destaque de IR",
                        value: "Recibo de Aluguel de Pessoa Jurídica com Destaque de IR"
                    }
                ]
            },
            {
                label: "Imposto", //optGroup
                options: [
                    {
                        label: "Valor Incorreto do IRRF Lançado no Sistema",
                        value: "Valor Incorreto do IRRF Lançado no Sistema",
                        optFields: [
                            { label: "Valor Lançado", type: "valor" },
                            { label: "Valor Correto", type: "valor" }
                        ]
                    },
                    {
                        label: "Valor Incorreto do PIS/COFINS/CSLL Lançado no Sistema",
                        value: "Valor Incorreto do PIS/COFINS/CSLL Lançado no Sistema",
                        optFields: [
                            { label: "Valor Lançado", type: "valor" },
                            { label: "Valor Correto", type: "valor" }
                        ]
                    },
                    {
                        label: "Valor Incorreto do ISSRF Lançado no Sistema",
                        value: "Valor Incorreto do ISSRF Lançado no Sistema",
                        optFields: [
                            { label: "Valor Lançado", type: "valor" },
                            { label: "Valor Correto", type: "valor" }
                        ]
                    },
                    {
                        label: "Valor Incorreto do INSS Lançado no Sistema",
                        value: "Valor Incorreto do INSS Lançado no Sistema",
                        optFields: [
                            { label: "Valor Lançado", type: "valor" },
                            { label: "Valor Correto", type: "valor" }
                        ]
                    },
                    {
                        label: "INSS não Lançado no Sistema",
                        value: "INSS não Lançado no Sistema"
                    },
                    {
                        label: "IRRF não Lançado no Sistema",
                        value: "IRRF não Lançado no Sistema"
                    },
                    {
                        label: "PIS/COFINS/CSLL não Lançado no Sistema",
                        value: "PIS/COFINS/CSLL não Lançado no Sistema"
                    },
                    {
                        label: "ISS Retido não Lançado no Sistema",
                        value: "ISS Retido não Lançado no Sistema"
                    },
                    {
                        label: "Base de Calculo Incorreta",
                        value: "Base de Calculo Incorreta"
                    },
                    {
                        label: "Base de Calculo Preenchida Indevidamente",
                        value: "Base de Calculo Preenchida Indevidamente"
                    }
                ]
            },
            {
                label: "RDV",
                options: [
                    { label: "Documento RDV Ilegível", value: "Documento RDV Ilegível" },
                    { label: "Itens do Documento RDV Ilegível", value: "Itens do Documento RDV Ilegível" },
                    { label: "Valor do Documento RDV Ilegível", value: "Valor do Documento RDV Ilegível" },
                    { label: "Ausência da Assinatura do Engenheiro no Espelho do RDV", value: "Ausência da Assinatura do Engenheiro no Espelho do RDV" },
                    { label: "Ausência da Assinatura do Chefe de Escritório no Espelho do RDV", value: "Ausência da Assinatura do Chefe de Escritório no Espelho do RDV" },
                    { label: "Ausência da Assinatura do Chefe de Escritório e Engenheiro no Espelho do RDV", value: "Ausência da Assinatura do Chefe de Escritório e Engenheiro no Espelho do RDV" },
                    { label: "Sem Nome do Beneficiário da Passagem", value: "Sem Nome do Beneficiário da Passagem" },

                    {
                        label: "Produto do RDV Lançado no Sistema",
                        value: "Produto do RDV Lançado no Sistema",
                        optFields: [
                            { label: "Produto Lançado", type: "Produto" },
                            { label: "Produto Correto", type: "Produto" }
                        ]
                    },
                    { label: "RDV sem Valor do Adiantamento Recebido", value: "RDV sem Valor do Adiantamento Recebido" },
                    { label: "Ausência das Informações na Capa do RDV", value: "Ausência das Informações na Capa do RDV" },
                    { label: "Carimbo RDV sem Descrição do Produto", value: "Carimbo RDV sem Descrição do Produto" },
                    { label: "RDV não Enviado", value: "RDV não Enviado" },
                    {
                        label: "Produto no Espelho do RDV",
                        value: "Produto no Espelho do RDV",
                        optFields: [
                            { label: "Produto Lançado: ", type: "Produto" },
                            { label: "Produto Correto: ", type: "Produto" }
                        ]
                    },
                    { label: "Carimbo RDV em Branco", value: "Carimbo RDV em Branco" },
                    {
                        label: "Emissão do RDV Divergente da Lançada no Sistema",
                        value: "Emissão do RDV Divergente da Lançada no Sistema",
                        optFields: [
                            { label: "Emissão do RDV: ", type: "date" },
                            { label: "Emissão Lançada no Sistema: ", type: "date" }
                        ]
                    },
                    {
                        label: "Nº do RDV Divergente do Lançado no Sistema",
                        value: "Nº do RDV Divergente do Lançado no Sistema",
                        optFields: [
                            { label: "Nº do RDV: ", type: "text" },
                            { label: "Nº Lançado no Sistema: ", type: "text" }
                        ]
                    },
                    { label: "Período de Saída e Retorno da Viagem Incompátiveis", value: "Período de Saída e Retorno da Viagem Incompátiveis" },
                    {
                        label: "Valor Total do RDV Lançado no Sistema",
                        value: "Valor Total do RDV Lançado no Sistema",
                        optFields: [
                            { label: "Valor Incorreto: ", type: "valor" },
                            { label: "Valor Correto do RDV: ", type: "valor" }
                        ]
                    }
                ]
            },
            {
                label: "Documento",
                options: [
                    { label: "Documento não Enviado", value: "Documento não Enviado" },
                    { label: "Favor Enviar Original", value: "Favor Enviar Original" },
                    { label: "Documento Ilegível", value: "Documento Ilegível" },
                    { label: "O Documento não foi Lançado no Sistema", value: "O Documento não foi Lançado no Sistema" },
                    { label: "Favor Enviar Comprovante de Pagamento", value: "Favor Enviar Comprovante de Pagamento" },
                    { label: "Documento não Aceito na Contabilidade", value: "Documento não Aceito na Contabilidade" }
                ]
            },
            {
                label: "Outros",
                options: [
                    { label: "Outros", value: "Outros" },
                    {
                        label: "Enviada Apenas Parte da Nota Fiscal",
                        value: "Enviada Apenas Parte da Nota Fiscal",
                        optFields: [
                            {
                                label: "Quantidade de Folhas Enviadas/Total",
                                type: "text"
                            }
                        ]
                    },
                    { label: "Documento não Deveria ser Lançado no Sistema pois não está no Nome da Castilho Engenharia", value: "Documento não Deveria ser Lançado no Sistema pois não está no Nome da Castilho Engenharia" }
                ]
            }
        ];

        return options;
    }

    renderCamposCategoriaDivergencia() {
        var options = this.renderOptionsCategoriaDivergencia();
        var CategoriaSelecionada = this.state.CategoriaDivergencia;
        var retorno = [<div></div>];
        var found = options.reduce((acc, optGroup) => {
            var foundOption = optGroup.options.find((option) => option.value == CategoriaSelecionada);
            if (foundOption) {
                acc = foundOption.optFields;
            }
            return acc;
        }, null);

        if (found) {
            for (const field of found) {
                retorno.push(
                    <div className="col-md-4">
                        <label htmlFor="">{field.label}</label>

                        {field.type == "CPF/CNPJ" ? (
                            <CNPJInput onChange={(e) => this.handleChangeParametrosDivergencia(field.label, e)} value={this.state[field.label]} />
                        ) : field.type == "Produto" ? (
                            <ProdutoInput onChange={(e) => this.handleChangeParametrosDivergencia(field.label, e)} value={this.state[field.label]} />
                        ) : field.type == "Departamento" ? (
                            <DepartamentoInput onChange={(e) => this.handleChangeParametrosDivergencia(field.label, e)} value={this.state[field.label]} />
                        ) : field.type == "date" ? (
                            <DateInput
                                onChange={(e) => {
                                    this.handleChangeParametrosDivergencia(field.label, e);
                                }}
                                value={this.state[field.label]}
                            />
                        ) : field.type == "Filial" ? (
                            <FilialInput
                                onChange={(e) => {
                                    this.handleChangeParametrosDivergencia(field.label, e);
                                }}
                                value={this.state[field.label]}
                            />
                        ) : (
                            <input type="text" name={field.label} id={field.label} className="form-control" value={this.state[field.label]} onChange={(e) => this.handleChangeParametrosDivergencia(e.target.name, e.target.value)} />
                        )}
                    </div>
                );
            }
        }

        if (retorno.length < 1) {
            return <div></div>;
        }
        return <div className="row">{retorno}</div>;
    }

    renderItens() {
        var Itens = this.state.Itens;
        var list = [];

        for (const [Index, item] of Itens.entries()) {
            list.push(<Item key={Index} ItemIndex={Index} CodigoProduto={item.CodigoProduto} Produto={item.Produto} Quantidade={item.Quantidade} ValorUnit={item.ValorUnit} CODUND={item.CODUND} />);
        }

        return <tbody>{list}</tbody>;
    }

    render() {
        var coligada = Coligadas.find((e) => {
            return e.CODCOLIGADA == this.state.Movimento.Coligada;
        });
        if (coligada == undefined) {
            coligada = {
                CODCOLIGADA: "",
                NOME: ""
            };
        }

        var filial = Filiais.find((e) => e.CODFILIAL == this.state.Movimento.Filial);
        if (filial) {
            filial = filial.CODFILIAL + " - " + filial.FILIAL;
        } else {
            filial = "";
        }

        return (
            <div>
                <div className="panel panel-primary">
                    <div className="panel-heading">
                        <h3 className="panel-title">Movimento</h3>
                    </div>
                    <div className="panel-body">
                        <BuscadorDeMovimento onBuscaMovimento={(e, i) => this.handleBuscaMovimento(e, i)} />
                        <br />
                        <div id="Lancamento">
                            <div className="row">
                                <div className="col-md-3">
                                    <div>
                                        <b>Coligada: </b>
                                        <span>{coligada.CODCOLIGADA + " - " + coligada.NOME}</span>
                                    </div>
                                    <br />
                                </div>
                                <div className="col-md-3">
                                    <div>
                                        <b>Filial: </b>
                                        <span>{filial}</span>
                                    </div>
                                    <br />
                                </div>
                                <div className="col-md-6">
                                    <div>
                                        <b>Fornecedor: </b>
                                        <span>{this.state.Movimento.CGCCFO + " - " + this.state.Movimento.Fornecedor}</span>
                                    </div>
                                    <br />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-3">
                                    <div>
                                        <b>Tipo de Movimento: </b>
                                        <span>{this.state.Movimento.CODTMV}</span>
                                    </div>
                                    <br />
                                </div>
                                <div className="col-md-3">
                                    <div>
                                        <b>Valor Total: </b>
                                        <MoneySpan text={this.state.Movimento.ValorTotal != "" ? "R$" + parseFloat(this.state.Movimento.ValorTotal).toFixed(2) : ""} />
                                    </div>
                                    <br />
                                </div>
                                <div className="col-md-3">
                                    <div>
                                        <b>Data de Emissão: </b>
                                        <span>{this.state.Movimento.DataEmissao}</span>
                                    </div>
                                    <br />
                                </div>
                                <div className="col-md-3">
                                    <div>
                                        <b>Usuário: </b>
                                        <span>{this.state.Movimento.Usuario}</span>
                                    </div>
                                    <br />
                                </div>
                            </div>
                            <div className="row" id="ItensMovimento">
                                <br />
                                <div className="col-md-12">
                                    {this.state.Itens.length > 0 && (
                                        <table className="table table-bordered table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Item</th>
                                                    <th>Produto</th>
                                                    <th>Qntd.</th>
                                                    <th>Valor Unit.</th>
                                                    <th>Valor Total</th>
                                                </tr>
                                            </thead>
                                            {this.renderItens()}
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="MotivoDivergencia" className="panel panel-primary">
                    <div className="panel-heading">
                        <h3 className="panel-title">Motivo da Divergência</h3>
                    </div>
                    <div className="panel-body">
                        <div>
                            <label htmlFor="">Categoria: </label>
                            <br />
                            <antd.Select
                                options={this.renderOptionsCategoriaDivergencia()}
                                showSearch
                                value={this.state.CategoriaDivergencia}
                                filterOption={(input, option) => {
                                    if (option.children) {
                                        return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0 ? true : false;
                                    } else if (option.label) {
                                        return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0 ? true : false;
                                    }
                                }}
                                onChange={(e) => this.handleChangeCategoriaDivergencia(e)}
                                style={{ width: "100%" }}
                            />

                            <br />
                            <br />
                        </div>

                        {this.renderCamposCategoriaDivergencia()}

                        <br />
                        <div>
                            <label htmlFor="">Observação: </label>
                            <textarea rows="4" className="form-control" value={this.state.ObservacaoDivergencia} onChange={(e) => this.setState({ ObservacaoDivergencia: e.target.value })} />
                        </div>

                        <br />
                        <div style={{ textAlign: "center" }}>
                            <button className="btn btn-danger" onClick={() => this.lancarDivergencia()}>
                                Lançar Divergencia
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class BuscadorDeMovimento extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            IDMOV: "",
            CODCOLIGADA: ""
        };
    }

    BuscaMovimento() {
        Promise.all([BuscaMovimentoRM(this.state.CODCOLIGADA, this.state.IDMOV), BuscaItensMovimentoRM(this.state.CODCOLIGADA, this.state.IDMOV)])
            .then((retorno) => {
                var movimentoRM = retorno[0];

                var DATASAIDA = movimentoRM.DATASAIDA;
                DATASAIDA = DATASAIDA.split(" ")[0].split("-").reverse().join("/");

                var DATAEMISSAO = movimentoRM.DATAEMISSAO;
                DATAEMISSAO = DATAEMISSAO.split(" ")[0].split("-").reverse().join("/");

                var movimento = {
                    Coligada: this.state.CODCOLIGADA,
                    IDMOV: this.state.IDMOV,
                    Filial: movimentoRM.CODFILIAL,
                    Fornecedor: movimentoRM.FORNECEDOR,
                    CGCCFO: movimentoRM.CGCCFO,
                    CODTMV: movimentoRM.CODTMV,
                    ValorTotal: movimentoRM.VALORBRUTO,
                    DataEmissao: DATAEMISSAO,
                    DataCriacao: DATASAIDA,
                    NumeroMov: movimentoRM.NUMEROMOV,
                    Serie: movimentoRM.SERIE,
                    Usuario: movimentoRM.USUARIOCRIACAO
                };

                var itensRM = retorno[1];
                var itens = [];
                for (const item of itensRM) {
                    itens.push({
                        Produto: item.PRODUTO,
                        CodigoProduto: item.CODIGOPRODUTO,
                        Quantidade: item.QUANTIDADE,
                        CODUND: item.CODUND,
                        ValorUnit: item.VALORUNITARIO
                    });
                }

                this.props.onBuscaMovimento(movimento, itens);
            })
            .catch(() => {
                var movimento = {
                    Coligada: "",
                    IDMOV: "",
                    Filial: "",
                    Fornecedor: "",
                    CGCCFO: "",
                    CODTMV: "",
                    ValorTotal: "",
                    DataEmissao: "",
                    DataCriacao: "",
                    NumeroMov: "",
                    Serie: "",
                    Usuario: ""
                };

                var itens = [];

                this.props.onBuscaMovimento(movimento, itens);
            });
    }

    render() {
        return (
            <div>
                <label htmlFor="">Identificador: </label>

                <div style={{ display: "flex", alignItems: "center" }}>
                    <select
                        name="ColigadaBuscarMovimento"
                        id="ColigadaBuscarMovimento"
                        className="form-control"
                        style={{ width: "fit-content", paddingRight: "30px" }}
                        value={this.state.CODCOLIGADA}
                        onChange={(e) => {
                            this.setState({ CODCOLIGADA: e.target.value });
                            BuscaProdutos(e.target.value);
                            BuscaFiliais(e.target.value);
                        }}
                    >
                        <option value=""></option>
                        {Coligadas.map((Coligada) => {
                            return <option value={Coligada.CODCOLIGADA}>{Coligada.CODCOLIGADA + " - " + Coligada.NOME}</option>;
                        })}
                    </select>
                    <input
                        type="number"
                        name="IdentificadorBuscarMovimento"
                        id="IdentificadorBuscarMovimento"
                        className="form-control"
                        value={this.state.IDMOV}
                        onChange={(e) => {
                            this.setState({ IDMOV: e.target.value });
                        }}
                    />
                    <button
                        className="btn btn-success"
                        onClick={() => {
                            this.BuscaMovimento();
                        }}
                        style={{ padding: "5px 30px" }}
                    >
                        Buscar
                    </button>
                </div>
            </div>
        );
    }
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.log(error, errorInfo);
        FLUIGC.toast({
            message: errorInfo,
            type: "danger"
        });
        FLUIGC.toast({
            message: error,
            type: "danger"
        });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return <h1>Um erro ocorreu! Tente atualizar a página, e caso o erro percista entre em contato com o Administrador do Sistema.</h1>;
        }

        return this.props.children;
    }
}

class CNPJInput extends React.Component {
    handleChange(value) {
        value = value.replace(/\D/g, "");
        value = value.split("");
        var formatValue = "";
        for (const [i, char] of value.entries()) {
            if (i == 2 || i == 5) {
                formatValue += ".";
            } else if (i == 8) {
                formatValue += "/";
            } else if (i == 12) {
                formatValue += "-";
            }

            if (i < 14) {
                formatValue += char;
            }
        }

        this.props.onChange(formatValue);
    }

    handleBlur(valor) {
        if (!validarCNPJ(valor)) {
            FLUIGC.toast({
                title: "CNPJ Inválido!",
                message: "",
                type: "warning"
            });
            this.props.onChange("");
        }
    }

    render() {
        return <input type="text" className="form-control" value={this.props.value} onChange={(e) => this.handleChange(e.target.value)} onBlur={(e) => this.handleBlur(e.target.value)} />;
    }
}

class ProdutoInput extends React.Component {
    render() {
        var options = Produtos;

        return (
            <div>
                <antd.AutoComplete style={{ width: "100%" }} value={this.props.value} onChange={(e) => this.props.onChange(e)} options={options} filterOption={(inputValue, option) => option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1} />
            </div>
        );
    }
}

class DepartamentoInput extends React.Component {
    render() {
        return (
            <div>
                <antd.Select
                    options={Departamentos}
                    showSearch
                    value={this.props.value}
                    filterOption={(input, option) => {
                        if (option.children) {
                            return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0 ? true : false;
                        } else if (option.label) {
                            return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0 ? true : false;
                        }
                    }}
                    onChange={(e) => this.props.onChange(e)}
                    style={{ width: "100%" }}
                />
            </div>
        );
    }
}

class FilialInput extends React.Component {
    render() {
        var optionsFiliais = [];
        for (const Filial of Filiais) {
            optionsFiliais.push({
                label: Filial.CODFILIAL + " - " + Filial.FILIAL,
                value: Filial.CODFILIAL + " - " + Filial.FILIAL
            });
        }

        return (
            <div>
                <antd.Select
                    options={optionsFiliais}
                    showSearch
                    value={this.props.value}
                    filterOption={(input, option) => {
                        if (option.children) {
                            return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0 ? true : false;
                        } else if (option.label) {
                            return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0 ? true : false;
                        }
                    }}
                    onChange={(e) => this.props.onChange(e)}
                    style={{ width: "100%" }}
                />
            </div>
        );
    }
}

class DateInput extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            value: this.formatDateString(this.props.value) || ""
        };
    }

    handleChange = (event) => {
        const inputValue = event.target.value.replace(/[^\d]/g, "");
        const day = inputValue.slice(0, 2);
        const month = inputValue.slice(2, 4);
        const year = inputValue.slice(4, 8);

        let formattedValue = "";

        if (day) {
            formattedValue += day;
            if (day.length === 2 && month) {
                formattedValue += "/" + month;
                if (month.length === 2 && year) {
                    formattedValue += "/" + year;
                }
            }
        }

        this.setState({ value: formattedValue });

        // Check if the input string is a valid date
        if (this.isValidDateString(formattedValue)) {
            this.props.onChange(formattedValue); // Signal that the input is valid
        } else {
            this.props.onChange(null); // Signal that the input is invalid
        }
    };

    handleBlur = () => {
        const inputDateString = this.state.value.replace(/[^\d]/g, "");
        if (!this.isValidDateString(this.state.value) && inputDateString.length > 0) {
            // If the input value is incomplete or invalid, clear it
            this.setState({ value: "" });
            this.props.onChange(null);
        }
    };

    formatDateString(dateString) {
        if (!dateString) {
            return "";
        }

        // Only format strings that look like a date
        if (!this.isValidDateString(dateString)) {
            return dateString;
        }

        // Add slashes to format the date as DD/MM/YYYY
        const parts = dateString.match(/^(\d{0,2})(\d{0,2})(\d{0,4})$/);
        const day = parts[1] || "";
        const month = parts[2] || "";
        const year = parts[3] || "";
        const formattedString = [day, month, year].filter(Boolean).join("/");
        return formattedString;
    }

    isValidDateString(dateString) {
        // Use a regular expression to check that the string matches the format DD/MM/YYYY
        const pattern = /^\d{0,2}\/\d{0,2}\/\d{0,4}$/;
        if (!pattern.test(dateString)) {
            return false;
        }

        // Parse the input string manually and check each component
        const parts = dateString.split("/");
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const inputDate = new Date(year, month, day);

        return inputDate.getDate() === day && inputDate.getMonth() === month && inputDate.getFullYear() === year;
    }

    render() {
        return <input type="text" value={this.state.value} onChange={this.handleChange} onBlur={this.handleBlur} placeholder="DD/MM/AAAA" className="form-control" />;
    }
}

class MoneySpan extends React.Component {
    //Componente usado para mostrar valores númericos, ele deixa as casas decimais com fonte menor
    render() {
        if (this.props.text != "R$ ") {
            return (
                <div style={{ display: "inline-block" }}>
                    <span>{this.props.text.split(".")[0]},</span>
                    <span style={{ fontSize: "80%" }}>{this.props.text.split(".")[1]}</span>
                </div>
            );
        } else {
            return "-";
        }
    }
}

class ModalDetalhes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            Movimento: "",
            Itens: "",
            MotivoCancelamento: ""
        };
        this.BuscaMovimento(this.props.Divergencia.Coligada, this.props.Divergencia.Identificador);

        this.CancelaDivergencia = this.CancelaDivergencia.bind(this); //Bind necessaria pra usar a function em conjunto com o jQuery na funcao componentDidMount
        this.getMotivoCancelamento = this.getMotivoCancelamento.bind(this); //Bind necessaria pra usar a function em conjunto com o jQuery na funcao componentDidMount
    }

    BuscaMovimento(CODCOLIGADA, IDMOV) {
        Promise.all([BuscaMovimentoRM(CODCOLIGADA, IDMOV), BuscaItensMovimentoRM(CODCOLIGADA, IDMOV)])
            .then((retorno) => {
                var movimentoRM = retorno[0];
                var DATASAIDA = movimentoRM.DATASAIDA;
                DATASAIDA = DATASAIDA.split(" ")[0].split("-").reverse().join("/");
                var DATAEMISSAO = movimentoRM.DATAEMISSAO;
                DATAEMISSAO = DATAEMISSAO.split(" ")[0].split("-").reverse().join("/");

                var movimento = {
                    ID: this.props.Divergencia.ID,
                    Coligada: this.props.Divergencia.Coligada,
                    IDMOV: this.props.Divergencia.Identificador,
                    Filial: movimentoRM.CODFILIAL,
                    Fornecedor: movimentoRM.FORNECEDOR,
                    CGCCFO: movimentoRM.CGCCFO,
                    CODTMV: movimentoRM.CODTMV,
                    ValorTotal: movimentoRM.VALORBRUTO,
                    DataEmissao: DATAEMISSAO,
                    DataCriacao: DATASAIDA,
                    NumeroMov: movimentoRM.NUMEROMOV,
                    Serie: movimentoRM.SERIE,
                    Usuario: movimentoRM.USUARIOCRIACAO
                };

                var itensRM = retorno[1];
                var itens = [];
                for (const item of itensRM) {
                    itens.push({
                        Produto: item.PRODUTO,
                        CodigoProduto: item.CODIGOPRODUTO,
                        Quantidade: item.QUANTIDADE,
                        CODUND: item.CODUND,
                        ValorUnit: item.VALORUNITARIO
                    });
                }

                this.setState(
                    {
                        Movimento: movimento,
                        Itens: itens
                    },
                    () => {}
                );
                //this.props.onBuscaMovimento(movimento, itens);
            })
            .catch((e) => {
                FLUIGC.toast({
                    title: "Erro ao Buscar Movimento!",
                    message: "",
                    type: "warning"
                });
                console.log(e);

                var movimento = {
                    Coligada: "",
                    IDMOV: "",
                    Filial: "",
                    Fornecedor: "",
                    CGCCFO: "",
                    CODTMV: "",
                    ValorTotal: "",
                    DataEmissao: "",
                    DataCriacao: "",
                    NumeroMov: "",
                    Serie: "",
                    Usuario: ""
                };

                var itens = [];

                this.setState({
                    Movimento: movimento,
                    Itens: itens
                });
                //this.props.onBuscaMovimento(movimento, itens);
            });
    }

    renderItens() {
        var Itens = this.state.Itens;
        var list = [];

        for (const [Index, item] of Itens.entries()) {
            list.push(<Item key={Index} ItemIndex={Index} CodigoProduto={item.CodigoProduto} Produto={item.Produto} Quantidade={item.Quantidade} ValorUnit={item.ValorUnit} CODUND={item.CODUND} />);
        }

        return <tbody>{list}</tbody>;
    }

    CancelaDivergencia() {
        this.props.onCancelarDivergencia(this.state.Movimento.ID, this.state.MotivoCancelamento);
    }

    getMotivoCancelamento() {
        return this.state.MotivoCancelamento;
    }

    componentDidMount() {
        $("[Cancelar-Divergencia]").on("click", { CancelaDivergencia: this.CancelaDivergencia, MotivoCancelamento: this.getMotivoCancelamento }, function (event) {
            console.log(event.data.MotivoCancelamento());
            if (!event.data.MotivoCancelamento()) {
                FLUIGC.toast({
                    title: "O Motivo do Cancelamento não foi Informado!",
                    message: "",
                    type: "warning"
                });
                return;
            } else {
                var myModal2 = FLUIGC.modal(
                    {
                        title: "Deseja Cancelar a Divergência?",
                        content: "",
                        id: "fluig-modal2",
                        size: "large",
                        actions: [
                            {
                                label: "Sim, Desejo Cancelar a Divergência",
                                classType: "btn-danger",
                                bind: "Confirma-Cancelar-Divergencia",
                                autoClose: true
                            },
                            {
                                label: "Não, Fechar sem Cancelar",
                                autoClose: true
                            }
                        ]
                    },
                    function (err, data) {
                        if (!err) {
                            $("[Confirma-Cancelar-Divergencia]").on("click", function () {
                                event.data.CancelaDivergencia();
                                myModal.remove();
                            });
                        }
                    }
                );
            }
        });
    }

    renderOptFieldsCategoria() {
        var list = [];

        var optFields = this.props.Divergencia.Divergencia.CamposCategoria;

        for (const campo of optFields) {
            list.push(
                <div className="col-md-4">
                    <b>{campo.label}: </b>
                    <span>{campo.value}</span>
                </div>
            );
        }

        return list;
    }

    render() {
        var coligada = Coligadas.find((e) => {
            return e.CODCOLIGADA == this.props.Divergencia.Coligada;
        });
        if (coligada == undefined) {
            coligada = {
                CODCOLIGADA: "",
                NOME: ""
            };
        }

        var filial = Filiais.find((e) => e.CODFILIAL == this.state.Movimento.Filial);
        if (filial) {
            filial = filial.CODFILIAL + " - " + filial.FILIAL;
        } else {
            filial = this.state.Movimento.Filial;
        }

        return (
            <div>
                <Panel title="Lançamento">
                    <div className="row">
                        <div className="col-md-3">
                            <div>
                                <b>Coligada: </b>
                                <span>{coligada.CODCOLIGADA + " - " + coligada.NOME}</span>
                            </div>
                            <br />
                        </div>
                        <div className="col-md-3">
                            <div>
                                <b>Filial: </b>
                                <span>{this.state.Movimento.Filial}</span>
                            </div>
                            <br />
                        </div>
                        <div className="col-md-6">
                            <div>
                                <b>Fornecedor: </b>
                                <span>{this.state.Movimento.CGCCFO + " - " + this.state.Movimento.Fornecedor}</span>
                            </div>
                            <br />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-3">
                            <div>
                                <b>Tipo de Movimento: </b>
                                <span>{this.state.Movimento.CODTMV}</span>
                            </div>
                            <br />
                        </div>
                        <div className="col-md-3">
                            <div>
                                <b>Valor Total: </b>
                                <MoneySpan text={this.state.Movimento.ValorTotal != "" ? "R$" + parseFloat(this.state.Movimento.ValorTotal).toFixed(2) : ""} />
                            </div>
                            <br />
                        </div>
                        <div className="col-md-3">
                            <div>
                                <b>Data de Emissão: </b>
                                <span>{this.state.Movimento.DataEmissao}</span>
                            </div>
                            <br />
                        </div>
                        <div className="col-md-3">
                            <div>
                                <b>Usuário: </b>
                                <span>{this.state.Movimento.Usuario}</span>
                            </div>
                            <br />
                        </div>
                    </div>
                    <div className="row" id="ItensMovimento">
                        <br />
                        <div className="col-md-12">
                            {this.state.Itens.length > 0 && (
                                <table className="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Produto</th>
                                            <th>Qntd.</th>
                                            <th>Valor Unit.</th>
                                            <th>Valor Total</th>
                                        </tr>
                                    </thead>
                                    {this.renderItens()}
                                </table>
                            )}
                        </div>
                    </div>
                </Panel>

                <Panel title="Divergência">
                    <div>
                        <h3>Divergência: {this.props.Divergencia.Divergencia.CategoriaDivergencia}</h3>
                        <b>Data de Criação: </b> <span>{this.props.Divergencia.Criacao}</span>
                    </div>
                    <div className="row">{this.renderOptFieldsCategoria()}</div>
                    <br />
                    {this.props.Divergencia.Divergencia.ObservacaoDivergencia != "" && (
                        <div>
                            <b>Observação: </b>
                            <br />

                            <p>{this.props.Divergencia.Divergencia.ObservacaoDivergencia}</p>
                        </div>
                    )}
                    <br />
                    <div>
                        <label htmlFor="" style={{ color: "red" }}>
                            Cancelar Divergência:{" "}
                        </label>
                        <br />

                        {this.props.Divergencia.status != "Cancelado" ? <textarea rows="4" onChange={(e) => this.setState({ MotivoCancelamento: e.target.value })} value={this.state.MotivoCancelamento} className="form-control form-control-danger" /> : <span>{this.props.Divergencia.MotivoCancelamento}</span>}
                    </div>
                </Panel>
            </div>
        );
    }
}

class Panel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            detailsIsShown: true
        };
    }

    handleClickDetails(e) {
        if (this.state.detailsIsShown) {
            $(e.target).closest(".panel").find(".panel-body:first").slideUp();
        } else {
            $(e.target).closest(".panel").find(".panel-body:first").slideDown();
        }
        this.setState({
            detailsIsShown: !this.state.detailsIsShown
        });
    }

    render() {
        return (
            <div className="panel panel-primary">
                <div
                    className="panel-heading"
                    onClick={(e) => {
                        this.handleClickDetails(e);
                    }}
                >
                    <div className={"details " + (this.state.detailsIsShown == true ? "detailsHide" : "detailsShow")}></div>
                    <h4 className="panel-title" style={{ display: "inline-block", verticalAlign: "middle" }}>
                        {this.props.title}
                    </h4>
                </div>
                <div className="panel-body">{this.props.children}</div>
            </div>
        );
    }
}
