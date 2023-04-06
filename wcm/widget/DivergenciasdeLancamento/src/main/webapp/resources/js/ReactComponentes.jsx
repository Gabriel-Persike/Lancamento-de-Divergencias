class InformacoesIniciais extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            Divergencias: [
                {
                    Emissao: "28/03/2023",
                    Identificador: "115152",
                    TipoMovimento: "1.1.02",
                    Filial: 1,
                    Criacao: "28/03/2023",
                    Fornecedor: "Fornecedor",
                    Usuario: "Mayara",
                    Divergencia: {
                        CategoriaDivergencia: "CNPJ "
                    }
                }
            ]
        };
    }

    handleLancamentoDivergencia(divergencia) {
        var Divergencias = this.state.Divergencias.slice();
        Divergencias.push(divergencia);
        this.setState(
            {
                Divergencias: Divergencias
            },
            () => {
                console.log(JSON.stringify(this.state.Divergencias));
            }
        );
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
                            <ListaDivergencias Divergencias={this.state.Divergencias} />
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
                <td>{this.props.Divergencia.Identificador}</td>
                <td>{this.props.Divergencia.TipoMovimento}</td>
                <td>{this.props.Divergencia.Filial}</td>
                <td>{this.props.Divergencia.Criacao}</td>
                <td>
                    {this.props.Divergencia.CGCCFO} <br /> {this.props.Divergencia.Fornecedor}
                </td>
                <td>{this.props.Divergencia.Usuario}</td>
                <td>{divergencia}</td>
                <td style={{ textAlign: "center" }}>
                    <button className="btn btn-primary" onClick={() => AbreModalDetalhes(this.props.Divergencia)}>
                        Detalhes
                    </button>
                </td>
            </tr>
        );
    }
}

class ListaDivergencias extends React.Component {
    renderDivergencias() {
        const Divergencias = this.props.Divergencias;
        return Divergencias.map((divergencia) => {
            return <LinhaDivergencia key={divergencia.Identificador} Divergencia={divergencia} />;
        });
    }

    render() {
        return (
            <div className="panel panel-primary">
                <div className="panel-heading">
                    <h3 className="panel-title">Divergências/Correções</h3>
                </div>
                <div className="panel-body">
                    <table className="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>Emissão</th>
                                <th>Identificador</th>
                                <th>Tipo Mov</th>
                                <th>Filial</th>
                                <th>Criação</th>
                                <th>Fornecedor</th>
                                <th>Usuário</th>
                                <th>Correção</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>{this.renderDivergencias()}</tbody>
                    </table>
                </div>
            </div>
        );
    }
}

function Item({ ItemIndex, Produto, Quantidade, ValorUnit, CODUND }) {
    return (
        <tr>
            <td>
                <span>{ItemIndex + 1}</span>
            </td>
            <td>
                <span>{Produto}</span>
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
            console.log(this.state.Movimento.Coligada);
            console.log(this.state.Movimento.IDMOV);

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
                Emissao: Movimento.DataEmissao,
                Identificador: Movimento.IDMOV,
                TipoMovimento: Movimento.CODTMV,
                Filial: Movimento.Filial,
                Criacao: Movimento.DataCriacao,
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
                CategoriaDivergencia: ""
            });
            FLUIGC.toast({
                title: "Divergência Lançada!!",
                message: "",
                type: "success"
            });
        }
    }

    handleBuscaMovimento(movimento, itens) {
        console.log(movimento);
        console.log(itens);
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
                label: "Assinatura", //optGroup
                options: [{ label: "NF/Recibo/Guia sem Assinatura do Chefe de Escritório e Engenheiro", value: "NF/Recibo/Guia sem Assinatura do Chefe de Escritório e Engenheiro" }]
            },
            {
                label: "Tipo de Movimento", //optGroup
                options: [{ label: "Devido a Nnatureza da Operação a NF não Deveria ter sido Lançada Neste Tipo de Movimento", value: "Devido a Nnatureza da Operação a NF não Deveria ter sido Lançada Neste Tipo de Movimento" }]
            },
            {
                label: "Coligada", //optGroup
                options: [
                    { label: "Despesa Devida no Consórcio e Lançada na Castilho", value: "Despesa Devida no Consórcio e Lançada na Castilho" },
                    { label: "Despesa Devida na Castilho e Lançada no Consórcio", value: "Despesa Devida na Castilho e Lançada no Consórcio" }
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
                    }
                ]
            },
            {
                label: "Outros",
                options: [{ label: "Outros", value: "Outros" }]
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
            list.push(<Item key={Index} ItemIndex={Index} Produto={item.Produto} Quantidade={item.Quantidade} ValorUnit={item.ValorUnit} CODUND={item.CODUND} />);
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
            return <h1>Something went wrong.</h1>;
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
                    value={this.props.CategoriaDivergencia}
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
            Itens: ""
        };
        this.BuscaMovimento(1, this.props.Divergencia.Identificador);
    }

    BuscaMovimento(CODCOLIGADA, IDMOV) {
        Promise.all([BuscaMovimentoRM(CODCOLIGADA, IDMOV), BuscaItensMovimentoRM(CODCOLIGADA, IDMOV)])
            .then((retorno) => {
                var movimentoRM = retorno[0];
                console.log(movimentoRM);

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

                this.setState(
                    {
                        Movimento: movimento,
                        Itens: itens
                    },
                    () => {
                        console.log(this.state.Movimento);
                        console.log(this.state.Itens);
                        console.log(this.props.Divergencia);
                    }
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
            list.push(<Item key={Index} ItemIndex={Index} Produto={item.Produto} Quantidade={item.Quantidade} ValorUnit={item.ValorUnit} CODUND={item.CODUND} />);
        }

        return <tbody>{list}</tbody>;
    }

    render() {
        console.log(this.state.Movimento);
        console.log(this.state.Itens);
        console.log(this.props.Divergencia);

        var coligada = Coligadas.find((e) => {
            return e.CODCOLIGADA == this.props.Coligada;
        });
        if (coligada == undefined) {
            coligada = {
                CODCOLIGADA: "",
                NOME: ""
            };
        }

        return (
            <div className="panel panel-primary">
                <div className="panel-heading">
                    <h3 className="panel-title">Divergência</h3>
                </div>
                <div className="panel-body">
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
                    </div>
                </div>
            </div>
        );
    }
}
