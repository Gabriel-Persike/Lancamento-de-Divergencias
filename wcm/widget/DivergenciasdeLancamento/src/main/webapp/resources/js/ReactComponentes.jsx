const useEffect = React.useEffect;
const useState = React.useState;
const Select = antd.Select;
const AntdOption = antd.Select.Option;
const DatePicker = antd.DatePicker;

var ChartQuantidadePorCategoria = null;
var ChartQuantidadePorUsuario = null;
var ChartQuantidadePorDataDeEmissao = null;

const colors = [
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FFA500", // Orange
    "#800080", // Purple
    "#008000", // Dark Green
    "#000080", // Navy Blue
    "#FFC0CB", // Pink
    "#FF4500", // Orange Red
    "#FFD700", // Gold
    "#FF1493", // Deep Pink
    "#00FF7F", // Spring Green
    "#8A2BE2", // Blue Violet
    "#ADFF2F", // Green Yellow
    "#7FFF00", // Chartreuse
    "#FF69B4", // Hot Pink
    "#00CED1", // Dark Turquoise
    "#F08080", // Light Coral
    "#87CEEB", // Sky Blue
    "#DDA0DD", // Plum
    "#00BFFF", // Deep Sky Blue
    "#9932CC", // Dark Orchid
    "#20B2AA", // Light Sea Green
    "#B0C4DE", // Light Steel Blue
    "#8B008B", // Dark Magenta
    "#2F4F4F", // Dark Slate Gray
    "#FF6347" // Tomato
];

function AppRoot() {
    const [Permissao, setPermissao] = useState({ Permissao: null, Obras: [] });

    useEffect(() => {
        BuscaPermissao();
    }, []);

    async function BuscaPermissao() {
        var user = WCMAPI.userCode;
        var { Permissao, Obras } = await VerificaPermissoesDoUsuario(user);
        setPermissao({ Permissao: Permissao, Obras: Obras });
    }

    return (
        <ErrorBoundary>
            <button className="btn btn-primary" onClick={BuscaPermissao}>
                Atualiza Permissao
            </button>
            <div id="divCollapse">
                <ul id="coltabs" className="nav nav-tabs nav-justified nav-pills" role="tablist" style={{ paddingBottom: "0px", width: "100%" }}>
                    {Permissao.Permissao == "Geral" && (
                        <>
                            <li className="collapse-tab active">
                                <a href="#tabLancarDivergencias" role="tab" id="atabLancarDivergencias" data-toggle="tab" aria-expanded="true" className="tab">
                                    Lançar Divergência
                                </a>
                            </li>
                            <li className="collapse-tab">
                                <a href="#tabEnviarEmails" role="tab" id="atabEnviarEmails" data-toggle="tab" aria-expanded="true" className="tab">
                                    Enviar E-mail
                                </a>
                            </li>
                        </>
                    )}
                    <li className="collapse-tab">
                        <a href="#tabListaDivergencias" role="tab" id="atabListaDivergencias" data-toggle="tab" aria-expanded="true" className="tab">
                            Lista de Divergências
                        </a>
                    </li>
                    <li className="collapse-tab">
                        <a href="#tabDashboards" role="tab" id="atabDashboards" data-toggle="tab" aria-expanded="true" className="tab">
                            Dashboards
                        </a>
                    </li>
                </ul>
                <div className="tab-content">
                    {Permissao.Permissao == "Geral" && (
                        <>
                            <div className="tab-pane active" id="tabLancarDivergencias">
                                <Lancamento />
                            </div>
                            <div className="tab-pane" id="tabEnviarEmails">
                                <NotificarDivergencias Permissao={Permissao} />
                            </div>
                        </>
                    )}
                    <div className="tab-pane" id="tabListaDivergencias">
                        <ListaDivergencias Permissao={Permissao} />
                    </div>
                    <div className="tab-pane" id="tabDashboards">
                        <DashboardDivergencias Permissao={Permissao} />
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
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

function FiltroListaDivergencias({ onBuscaDivergencias, Permissao }) {
    const [Filtros, setFiltros] = useState({
        FiltroObra: "Todos",
        FiltroUsuario: "Todos",
        FiltroTipoDeMovimento: "Todos",
        FiltroPeriodo: "Lancamento",
        FiltroPeriodoInicio: moment().subtract(1, "year"),
        FiltroPeriodoFim: moment(),
        FiltroStatus: "Ativo"
    });

    const [OptionsObras, setOptionsObras] = useState([]);
    const [OptionsUsuarios, setOptionsUsuarios] = useState([]);
    const [BuscandoDivergencias, setBuscandoDivergencias] = useState(false);

    useEffect(() => {
        CriaListaNoFiltroPorObra();
        CriaListaNoFiltroPorUsuario();
    }, []);

    useEffect(() => {
        CriaListaNoFiltroPorObra();
    }, [Permissao]);

    function handleChangeFiltro(target, value) {
        setFiltros((prevFiltros) => ({
            ...prevFiltros,
            [target]: value
        }));
    }

    function CriaListaNoFiltroPorObra() {
        var obras = [];
        if (Permissao.Permissao == "VisualizacaoObra") {
            obras = Permissao.Obras.map((e) => {
                return { label: e, value: e };
            });
        } else {
            BuscaTodasObras().then((TodasObras) => {
                obras = TodasObras.map((e) => {
                    return { value: e.perfil, label: e.CODCCUSTO + " - " + e.perfil };
                });
            });
        }

        obras.push({ value: "Todos", label: "Todos" });
        setOptionsObras(obras);
    }

    async function CriaListaNoFiltroPorUsuario() {
        if (Permissao == "VisualizacaoUsuario") {
            setOptionsUsuarios({ label: WCMAPI.userCode, value: WCMAPI.userCode });
        } else {
            var usuarios = await ExecutaDataset("colleague", ["colleagueId"], [], null);
            usuarios = usuarios.map((e) => {
                return { label: e.colleagueId, value: e.colleagueId };
            });
            usuarios.push({ label: "Todos", value: "Todos" });
            setOptionsUsuarios(usuarios);
        }
    }

    async function BuscarDivergencias() {
        var filtros = {
            Obra: Filtros.FiltroObra,
            Usuario: Filtros.FiltroUsuario,
            TipoDeMovimento: Filtros.FiltroTipoDeMovimento,
            Periodo: Filtros.FiltroPeriodo,
            PeriodoInicio: Filtros.FiltroPeriodoInicio,
            PeriodoFim: Filtros.FiltroPeriodoFim,
            Status: Filtros.FiltroStatus
        };

        onBuscaDivergencias(await BuscaDivergencias(filtros));
    }

    return (
        <Panel Title="Filtro" HideAble={true} IniciaFechado={true}>
            <div className="row">
                <div className="col-md-4">
                    <b>Obra:</b>
                    <Select
                        style={{ width: "100%" }}
                        showSearch
                        filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                        value={Filtros.FiltroObra}
                        onChange={(e) => handleChangeFiltro("FiltroObra", e)}
                    >
                        {OptionsObras.map((e) => (
                            <AntdOption value={e.value}>{e.label}</AntdOption>
                        ))}
                    </Select>
                </div>
                <div className="col-md-4">
                    <b>Usuário:</b>
                    <Select
                        style={{ width: "100%" }}
                        showSearch
                        filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                        options={OptionsUsuarios}
                        value={Filtros.FiltroUsuario}
                        onChange={(e) => handleChangeFiltro("FiltroUsuario", e)}
                    />
                </div>
                <div className="col-md-4">
                    <b>Tipo de Movimento:</b>
                    <select className="form-control" value={Filtros.FiltroTipoDeMovimento} onChange={(e) => handleChangeFiltro("FiltroTipoDeMovimento", e.target.value)}>
                        <option value="Todos">Todos</option>
                        <option value="1.2.01">1.2.01</option>
                        <option value="1.2.03">1.2.03</option>
                        <option value="1.2.04">1.2.04</option>
                        <option value="1.2.05">1.2.05</option>
                        <option value="1.2.06">1.2.06</option>
                        <option value="1.2.07">1.2.07</option>
                        <option value="1.2.08">1.2.08</option>
                        <option value="1.2.09">1.2.09</option>
                        <option value="1.2.10">1.2.10</option>
                        <option value="1.2.11">1.2.11</option>
                        <option value="1.2.13">1.2.13</option>
                        <option value="1.2.14">1.2.14</option>
                        <option value="1.2.15">1.2.15</option>
                        <option value="1.2.17">1.2.17</option>
                        <option value="1.2.21">1.2.21</option>
                        <option value="1.2.22">1.2.22</option>
                        <option value="1.2.24">1.2.24</option>
                        <option value="1.2.30">1.2.30</option>
                        <option value="1.2.31">1.2.31</option>
                        <option value="1.2.32">1.2.32</option>
                        <option value="1.2.38">1.2.38</option>
                        <option value="1.2.39">1.2.39</option>
                        <option value="1.2.40">1.2.40</option>
                    </select>
                </div>
            </div>
            <br />
            <div className="row">
                <div className="col-md-4">
                    <b>Período:</b>
                    <select className="form-control" value={Filtros.FiltroPeriodo} onChange={(e) => handleChangeFiltro("FiltroPeriodo", e.target.value)}>
                        <option value="Emissao">Data de Emissão</option>
                        <option value="Lancamento">Data de Lançamento da Divergência</option>
                    </select>
                </div>
                <div className="col-md-2">
                    <b>Periodo Inicio:</b>
                    <br />
                    <DatePicker
                        format={"DD/MM/YYYY"}
                        onChange={(e) => {
                            handleChangeFiltro("FiltroPeriodoInicio", e);
                        }}
                        value={Filtros.FiltroPeriodoInicio}
                        style={{ width: "100%" }}
                    />
                </div>
                <div className="col-md-2">
                    <b>Periodo Final:</b>
                    <br />
                    <DatePicker format={"DD/MM/YYYY"} onChange={(e) => handleChangeFiltro("FiltroPeriodoFim", e)} value={Filtros.FiltroPeriodoFim} style={{ width: "100%" }} />
                </div>
                <div className="col-md-4">
                    <b>Status:</b>
                    <select className="form-control" value={Filtros.FiltroStatus} onChange={(e) => handleChangeFiltro("FiltroStatus", e.target.value)}>
                        <option value="Ativo">Ativo</option>
                        <option value="Cancelado">Cancelado</option>
                        <option value="Todos">Todos</option>
                    </select>
                </div>
            </div>
            <br />
            <div style={{ textAlign: "right" }}>
                <button
                    className="btn btn-success"
                    onClick={async () => {
                        if (!BuscandoDivergencias) {
                            setBuscandoDivergencias(true);
                            await BuscarDivergencias();
                            setBuscandoDivergencias(false);
                        }
                    }}
                >
                    {BuscandoDivergencias == true ? "Buscando..." : "Buscar"}
                </button>
            </div>
        </Panel>
    );
}

//  LANÇAMENTO DE DIVERGENCIAS
class Lancamento extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            CategoriaDivergencia: "",
            CamposCategoriaDivergencia: "",
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

    validaLancamentoDivergencia() {
        //Verifica se todos os campos foram preenchidos antes de lancar a divergencia
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
            for (const Campo of this.state.CamposCategoriaDivergencia) {
                if (Campo.value == "" || Campo.value == undefined) {
                    FLUIGC.toast({
                        title: "Campo complementar da Categoria não informado!",
                        message: "",
                        type: "warning"
                    });
                    return false;
                }
            }
        }

        //Se passou a validacao retorna true
        return true;
    }

    lancarDivergencia() {
        if (this.validaLancamentoDivergencia()) {
            var Movimento = this.state.Movimento;
            var CategoriaSelecionada = this.state.CategoriaDivergencia;
            var CamposComplementaresCategoria = this.state.CamposCategoriaDivergencia;
            var ObservacaoDivergencia = this.state.ObservacaoDivergencia;

            for (const Campo of CamposComplementaresCategoria) {
                if (Campo.type == "Date") {
                    Campo.value = Campo.value.format("DD/MM/YYYY");
                }
            }

            var Divergencia = {
                CODCOLIGADA: Movimento.Coligada,
                IDMOV: Movimento.IDMOV,
                CATEGORIA: CategoriaSelecionada,
                OBS_DIVERG: {
                    CamposComplementaresCategoria: CamposComplementaresCategoria,
                    ObservacaoDivergencia: ObservacaoDivergencia
                }
            };

            CriaDivergencia(Divergencia).then(() => {
                //Apos lancar a divergencia limpa os campos
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
            });
        }
    }

    renderItens() {
        var Itens = this.state.Itens;
        var list = [];

        for (const [Index, item] of Itens.entries()) {
            list.push(
                <Item
                    key={Index}
                    ItemIndex={Index}
                    CodigoProduto={item.CodigoProduto}
                    Produto={item.Produto}
                    Quantidade={item.Quantidade}
                    ValorUnit={item.ValorUnit}
                    CODUND={item.CODUND}
                />
            );
        }

        return <tbody>{list}</tbody>;
    }

    render() {
        //Busca Codigo e Nome da Coligada
        var coligada = Coligadas.find((e) => {
            return e.CODCOLIGADA == this.state.Movimento.Coligada;
        });
        if (coligada == undefined) {
            coligada = {
                CODCOLIGADA: "",
                NOME: ""
            };
        }

        //Busca Codigo e Nome da Filial
        var filial = Filiais.find((e) => e.CODFILIAL == this.state.Movimento.Filial);
        if (filial) {
            filial = filial.CODFILIAL + " - " + filial.FILIAL;
        } else {
            filial = "";
        }

        return (
            <div>
                <Panel Title="Movimento">
                    <BuscadorDeMovimento
                        onBuscaMovimento={(movimento, itens) =>
                            this.setState({
                                Movimento: movimento,
                                Itens: itens
                            })
                        }
                    />
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
                                    <MoneySpan value={this.state.Movimento.ValorTotal != "" ? parseFloat(this.state.Movimento.ValorTotal) : ""} />
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
                </Panel>
                <Panel Title="Motivo da Divergência">
                    <LancamentoDivergencia
                        CategoriaDivergencia={this.state.CategoriaDivergencia}
                        onChangeCategoriaDivergencia={(e) => this.setState({ CategoriaDivergencia: e })}
                        ObservacaoDivergencia={this.state.ObservacaoDivergencia}
                        onChangeObservacaoDivergencia={(e) => this.setState({ ObservacaoDivergencia: e })}
                        onChangeCamposCategoriaDivergencia={(e) => this.setState({ CamposCategoriaDivergencia: e })}
                    />
                    <br />
                    <div style={{ textAlign: "center" }}>
                        <button className="btn btn-danger" onClick={() => this.lancarDivergencia()}>
                            Lançar Divergencia
                        </button>
                    </div>
                </Panel>
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
                    Usuario: movimentoRM.CODUSUARIO
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
                            return (
                                <option key={Coligada.CODCOLIGADA} value={Coligada.CODCOLIGADA}>
                                    {Coligada.CODCOLIGADA + " - " + Coligada.NOME}
                                </option>
                            );
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
function LancamentoDivergencia({ CategoriaDivergencia, onChangeCategoriaDivergencia, ObservacaoDivergencia, onChangeObservacaoDivergencia, onChangeCamposCategoriaDivergencia }) {
    const [ListaCategoriasDeDivergencias, setListaCategoriasDeDivergencias] = useState([]);
    const [CamposComplementaresCategoriasDeDivergencias, setCamposComplementaresCategoriasDeDivergencias] = useState([]);

    useEffect(() => {
        BuscaCategoriasDivergencia().then((e) => {
            setListaCategoriasDeDivergencias(e);
        });
    }, []);

    useEffect(() => {
        setCamposComplementaresCategoriasDeDivergencias(BuscaCamposComplementaresCategoriaDivergencia(CategoriaDivergencia));
    }, [CategoriaDivergencia]);

    useEffect(() => {
        onChangeCamposCategoriaDivergencia(CamposComplementaresCategoriasDeDivergencias);
    }, [CamposComplementaresCategoriasDeDivergencias]);

    function handleChangeDadosCamposComplementares(label, value) {
        var Dados = CamposComplementaresCategoriasDeDivergencias.map((obj) => {
            if (obj.label == label) {
                //Altera o Valor quando a label é igual ao parametro label
                return {
                    ...obj,
                    value: value
                };
            }
            return obj;
        });

        setCamposComplementaresCategoriasDeDivergencias(Dados);
    }

    function RenderizaCamposComplementaresDaCategoriaDaDivergencia() {
        var retorno = [];
        var i = 0;
        for (const CampoComplementar of CamposComplementaresCategoriasDeDivergencias) {
            i++;
            retorno.push(
                <div className="col-md-4" key={i}>
                    <label htmlFor="">{CampoComplementar.label}</label>
                    {BuscaInputComponenteComBaseNoTipoDeInput(CampoComplementar.type, CampoComplementar.label, BuscaValorDosCamposComplementares(CampoComplementar.label))}
                </div>
            );
        }
        return <div className="row">{retorno}</div>;
    }

    function BuscaInputComponenteComBaseNoTipoDeInput(Tipo, label, value) {
        if (Tipo == "CPF/CNPJ") {
            return <CPFCNPJInput onChange={(e) => handleChangeDadosCamposComplementares(label, e)} value={value} />;
        } else if (Tipo == "CNPJ") {
            return <CPFCNPJInput onChange={(e) => handleChangeDadosCamposComplementares(label, e)} value={value} type="CNPJ" />;
        } else if (Tipo == "CPF") {
            return <CPFCNPJInput onChange={(e) => handleChangeDadosCamposComplementares(label, e)} value={value} type="CPF" />;
        } else if (Tipo == "Produto") {
            return <ProdutoInput onChange={(e) => handleChangeDadosCamposComplementares(label, e)} value={value} />;
        } else if (Tipo == "Money") {
            return <MoneyInput onChange={(e) => handleChangeDadosCamposComplementares(label, e)} value={value} />;
        } else if (Tipo == "Date") {
            return (
                <DatePicker
                    format={"DD/MM/YYYY"}
                    onChange={(e) => {
                        handleChangeDadosCamposComplementares(label, e);
                    }}
                    value={value}
                    style={{ width: "100%" }}
                />
            );
        } else if (Tipo == "Filial") {
            return (
                <FilialInput
                    onChange={(e) => {
                        handleChangeDadosCamposComplementares(label, e);
                    }}
                    value={value}
                />
            );
        } else {
            return (
                <input
                    type="text"
                    name={label}
                    id={label}
                    className="form-control"
                    value={value}
                    onChange={(e) => handleChangeDadosCamposComplementares(e.target.name, e.target.value)}
                />
            );
        }
    }

    function BuscaValorDosCamposComplementares(label) {
        var found = CamposComplementaresCategoriasDeDivergencias.find((e) => e.label == label);
        return found.value;
    }

    return (
        <div>
            <div className="CategoriaDivergencia">
                <label htmlFor="">Categoria: </label>
                <antd.Select
                    options={ListaCategoriasDeDivergencias}
                    showSearch
                    value={CategoriaDivergencia}
                    filterOption={(input, option) => {
                        if (option.children) {
                            return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0 ? true : false;
                        } else if (option.label) {
                            return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0 ? true : false;
                        }
                    }}
                    onChange={(e) => onChangeCategoriaDivergencia(e)}
                    style={{ width: "100%" }}
                />
            </div>
            <br />
            <div className="CamposComplementaresCategoriaDivergencia">{RenderizaCamposComplementaresDaCategoriaDaDivergencia()}</div>
            <br />
            <div className="ObservacaoDivergencia">
                <label htmlFor="">Observação: </label>
                <textarea rows="4" className="form-control" value={ObservacaoDivergencia} onChange={(e) => onChangeObservacaoDivergencia(e.target.value)} />
            </div>
        </div>
    );
}


//  LISTAR DIVERGENCIAS
function ListaDivergencias({ onBuscaDivergencias, Permissao }) {
    const [Divergencias, setDivergencias] = useState([]);

    useEffect(() => {
        IniciaDataTables();
        handleBuscaDivergencias();
    }, []);

    useEffect(() => {
        //Toda vez que o componente foi atualizado passa as Divergencias para a DataTables
        AtualizaDataTables();
    }, [Divergencias]);

    function IniciaDataTables() {
        //Ao Criar o componente Inicia a DataTables
        DataTableDivergencias = $("#TableDivergencias").DataTable({
            pageLength: 25,
            columns: [
                {
                    data: "NUMEROMOV"
                },
                {
                    data: "DATAEMISSAO",
                    render: function (data, type, row) {
                        if (type == "sort") {
                            return moment(data, "YYYY-MM-DD").valueOf();
                        } else {
                            return moment(data, "YYYY-MM-DD").format("DD/MM/YYYY");
                        }
                    }
                },
                { data: "CODTMV" },
                { data: "CODFILIAL" },
                {
                    data: "CREATEDON",
                    render: function (data, type, row) {
                        if (type == "sort") {
                            return moment(data, "YYYY-MM-DD").valueOf();
                        } else {
                            return moment(data, "YYYY-MM-DD").format("DD/MM/YYYY");
                        }
                    }
                },
                {
                    render: function (data, type, row) {
                        return "<span>" + row.CGCCFO + " <br /> " + row.FORNECEDOR + "</span>";
                    }
                },
                { data: "CODUSUARIO" },
                {
                    data: "CATEGORIA",
                    render: function (data, type, row) {
                        return data;
                    }
                },
                {
                    render: function (data, type, row) {
                        if (row.STATUS == "false") {
                            return (
                                "<div style='text-align:center'><button class='btn btn-danger btnShowDetails bs-docs-popover-hover' data-toggle='popover' data-content='" +
                                row.MOTIVO_CANC +
                                "' >Detalhes</button></div>"
                            );
                        } else {
                            return (
                                "<div style='text-align:center'><button class='btn " +
                                (row.EMAIL_PEND == "true" ? "btn-info" : "btn-primary") +
                                " btnShowDetails'>Detalhes</button></div>"
                            );
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

        //Toda vez que o componente for atualizado Cria a trigger on("draw") na DataTables
        DataTableDivergencias.on("draw", { onBuscaDivergencias: onBuscaDivergencias }, (e) => {
            FLUIGC.popover(".bs-docs-popover-hover", { trigger: "hover", placement: "auto" });
            $(".btnShowDetails").off("click");
            $(".btnShowDetails").on("click", function () {
                //Cria a trigger no botão Detalhes que ao ser clicado abre a Modal Detalhes
                var tr = $(this).closest("tr");
                var row = DataTableDivergencias.row(tr);
                var values = row.data();
                AbreModalDetalhes(values, e.data.onBuscaDivergencias);
            });
        });
    }

    function AtualizaDataTables(){
        DataTableDivergencias.clear();
        DataTableDivergencias.rows.add(Divergencias);
        setTimeout(() => {
            DataTableDivergencias.columns.adjust().draw();
        }, 200);
    }

    async function handleBuscaDivergencias() {
        var filtros = {
            Obra: Filtros.FiltroObra,
            Usuario: Filtros.FiltroUsuario,
            TipoDeMovimento: Filtros.FiltroTipoDeMovimento,
            Periodo: Filtros.FiltroPeriodo,
            PeriodoInicio: Filtros.FiltroPeriodoInicio,
            PeriodoFim: Filtros.FiltroPeriodoFim,
            Status: Filtros.FiltroStatus
        };

        setDivergencias(await BuscaDivergencias(filtros));
    }

    return (
        <>
            <FiltroListaDivergencias onBuscaDivergencias={handleBuscaDivergencias} Permissao={Permissao} />
            <Panel Title="Divergências/Correções">
                <table className="table table-bordered table-striped" id="TableDivergencias" style={{ width: "100%" }}>
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Emissão</th>
                            <th>T.M.</th>
                            <th>Filial</th>
                            <th>Data Divergência</th>
                            <th>Fornecedor</th>
                            <th>Usuário</th>
                            <th>Correção</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </Panel>
        </>
    );
}
class ModalDetalhes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            Movimento: "",
            Itens: "",
            MotivoCancelamento: ""
        };
        this.BuscaMovimento(this.props.Divergencia.CODCOLIGADA, this.props.Divergencia.IDMOV);

        this.handleCancelaDivergencia = this.handleCancelaDivergencia.bind(this); //Bind necessaria pra usar a function em conjunto com o jQuery na funcao componentDidMount
        // this.getMotivoCancelamento = this.getMotivoCancelamento.bind(this); //Bind necessaria pra usar a function em conjunto com o jQuery na funcao componentDidMount
    }

    componentDidMount() {
        //Caso o usuário tenha clicado no botão Cancelar abre uma Modal pro usuario confirmar se realmente quer cancelar
        $("[Cancelar-Divergencia]").on("click", { CancelaDivergencia: this.handleCancelaDivergencia }, function (event) {
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
                            //Caso o usuario escolha que realmente deseja cancelar chama o handler de cancelar a divergencia e fecha a modal
                            event.data.CancelaDivergencia();
                        });
                    }
                }
            );
        });
    }

    BuscaMovimento(CODCOLIGADA, IDMOV) {
        BuscaItensMovimentoRM(CODCOLIGADA, IDMOV)
            .then((itensRM) => {
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

                this.setState({
                    Itens: itens
                });
            })
            .catch(() => {
                this.setState({
                    Itens: []
                });
            });
    }

    async handleCancelaDivergencia() {
        if (this.state.MotivoCancelamento) {
            await CancelaDivergencia(this.props.Divergencia, this.state.MotivoCancelamento);
            this.props.onBuscaDivergencias();
            myModal.remove();
        } else {
            FLUIGC.toast({
                title: "Motivo do Cancelamento não informado!",
                message: "",
                type: "warning"
            });
        }
    }

    getMotivoCancelamento() {
        return this.state.MotivoCancelamento;
    }

    renderItens() {
        var Itens = this.state.Itens;
        var list = [];

        for (const [Index, item] of Itens.entries()) {
            list.push(
                <Item
                    key={Index}
                    ItemIndex={Index}
                    CodigoProduto={item.CodigoProduto}
                    Produto={item.Produto}
                    Quantidade={item.Quantidade}
                    ValorUnit={item.ValorUnit}
                    CODUND={item.CODUND}
                />
            );
        }

        return <tbody>{list}</tbody>;
    }

    renderOptFieldsCategoria() {
        //Renderiza os campos complementares da Categoria da Divergencia
        var list = [];
        var optFields = this.props.Divergencia.OBS_DIVERG.CamposComplementaresCategoria;
        for (const CampoComplementar of optFields) {
            if (CampoComplementar.type == "Money") {
                list.push(
                    <div className="col-md-4" key={CampoComplementar.label}>
                        <b>{CampoComplementar.label}: </b>
                        <MoneySpan value={CampoComplementar.value} />
                    </div>
                );
            } else {
                list.push(
                    <div className="col-md-4" key={CampoComplementar.label}>
                        <b>{CampoComplementar.label}: </b>
                        <span>{CampoComplementar.value}</span>
                    </div>
                );
            }
        }

        return list;
    }

    render() {
        return (
            <div>
                <Panel Title="Lançamento">
                    <div className="row">
                        <div className="col-md-3">
                            <div>
                                <b>Coligada: </b>
                                <span>{this.props.Divergencia.CODCOLIGADA + " - " + this.props.Divergencia.COLIGADA}</span>
                            </div>
                            <br />
                        </div>
                        <div className="col-md-3">
                            <div>
                                <b>Filial: </b>
                                <span>{this.props.Divergencia.CODFILIAL + " - " + this.props.Divergencia.FILIAL}</span>
                            </div>
                            <br />
                        </div>
                        <div className="col-md-6">
                            <div>
                                <b>Fornecedor: </b>
                                <span>{this.props.Divergencia.CGCCFO + " - " + this.props.Divergencia.FORNECEDOR}</span>
                            </div>
                            <br />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-3">
                            <div>
                                <b>Tipo de Movimento: </b>
                                <span>{this.props.Divergencia.CODTMV}</span>
                            </div>
                            <br />
                        </div>
                        <div className="col-md-3">
                            <div>
                                <b>Valor Total: </b>
                                <MoneySpan value={this.props.Divergencia.VALORBRUTO != "" ? parseFloat(this.props.Divergencia.VALORBRUTO).toFixed(2) : ""} />
                            </div>
                            <br />
                        </div>
                        <div className="col-md-3">
                            <div>
                                <b>Data de Emissão: </b>
                                <span>{FormataDataParaDDMMYYYY(this.props.Divergencia.DATAEMISSAO.split(" ")[0])}</span>
                            </div>
                            <br />
                        </div>
                        <div className="col-md-3">
                            <div>
                                <b>Usuário: </b>
                                <span>{this.props.Divergencia.CODUSUARIO}</span>
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

                <Panel Title="Divergência">
                    <div>
                        <h3>Divergência: {this.props.Divergencia.CATEGORIA}</h3>
                        <b>Data da Divergência: </b> <span>{FormataDataParaDDMMYYYY(this.props.Divergencia.CREATEDON)}</span>
                    </div>
                    <div className="row">{this.renderOptFieldsCategoria()}</div>
                    <br />
                    {this.props.Divergencia.OBS_DIVERG.ObservacaoDivergencia != "" && (
                        <div>
                            <b>Observação: </b>
                            <br />

                            <p>{this.props.Divergencia.OBS_DIVERG.ObservacaoDivergencia}</p>
                        </div>
                    )}
                    <br />
                    <div>
                        <label htmlFor="" style={{ color: "red" }}>
                            Cancelar Divergência:
                        </label>
                        <br />

                        {this.props.Divergencia.STATUS != "false" ? (
                            <textarea
                                rows="4"
                                onChange={(e) => this.setState({ MotivoCancelamento: e.target.value })}
                                value={this.state.MotivoCancelamento}
                                className="form-control form-control-danger"
                            />
                        ) : (
                            <span>{this.props.Divergencia.MOTIVO_CANC}</span>
                        )}
                    </div>
                </Panel>
            </div>
        );
    }
}


// ENVIAR EMAIL
function NotificarDivergencias({ Permissao }) {
    const [Filtros, setFiltros] = useState({
        FiltroObra: "Todos",
        FiltroUsuario: "Todos",
        FiltroTipoDeMovimento: "Todos",
        FiltroPeriodo: "Lancamento",
        FiltroPeriodoInicio: moment().subtract(1, "year"),
        FiltroPeriodoFim: moment(),
        FiltroStatus: "Todos"
    });
    const [Divergencias, setDivergencias] = useState([]);

    function handleChangeFiltro(target, value) {
        setFiltros((prevFiltros) => ({
            ...prevFiltros,
            [target]: value
        }));
    }

    async function handleBuscaDivergencias() {
        var filtros = {
            Obra: Filtros.FiltroObra,
            Usuario: Filtros.FiltroUsuario,
            TipoDeMovimento: Filtros.FiltroTipoDeMovimento,
            Periodo: Filtros.FiltroPeriodo,
            PeriodoInicio: Filtros.FiltroPeriodoInicio,
            PeriodoFim: Filtros.FiltroPeriodoFim,
            Status: Filtros.FiltroStatus,
            EMAIL_PEND: true
        };

        var Divergencias = await BuscaDivergencias(filtros);
        Divergencias = await AgrupaDivergenciasPorUsuario(Divergencias);
        setDivergencias(Divergencias);

        async function AgrupaDivergenciasPorUsuario(Divergencias) {
            var DivergenciasAgrupadasPorUsuario = [];
            for (const Divergencia of Divergencias) {
                var found = DivergenciasAgrupadasPorUsuario.find((e) => e.CODUSUARIO == Divergencia.CODUSUARIO);

                if (found) {
                    found.Divergencias.push(Divergencia);
                } else {
                    DivergenciasAgrupadasPorUsuario.push({
                        CODUSUARIO: Divergencia.CODUSUARIO,
                        EmailCopia: await BuscaEmailsCopia(Divergencia.CODUSUARIO),
                        Observacao: "",
                        CheckEnvio: false,
                        Divergencias: [Divergencia]
                    });
                }
            }

            return DivergenciasAgrupadasPorUsuario;
        }

        async function BuscaEmailsCopia(Usuario) {
            try {
                var emails = [BuscaEmailUsuario(Usuario), "contabilidade@castilho.com.br", "gabriel.persike@castilho.com.br"];
                var ds = await ExecutaDataset("colleagueGroup", null, [DatasetFactory.createConstraint("colleagueId", Usuario, Usuario, ConstraintType.MUST)], null, true);

                var usuarioMatriz = false;

                for (const Grupo of ds) {
                    if (Grupo["colleagueGroupPK.groupId"] == "Comprador") {
                        emails.push("karina.belli@castilho.com.br");
                        usuarioMatriz = true;
                    } else if (Grupo["colleagueGroupPK.groupId"] == "Controladoria") {
                        emails.push("claudio@castilho.com.br");
                        usuarioMatriz = true;
                    } else if (Grupo["colleagueGroupPK.groupId"].substring(0, 4) == "Obra") {
                        var chefes = await BuscaChefeDeEscritorioDoGrupo(Grupo["colleagueGroupPK.groupId"]);
                        for (const Chefe of chefes) {
                            var email = BuscaEmailUsuario(Chefe["colleagueGroupPK.colleagueId"]);
                            var found = emails.find((e) => e == email);
                            if (!found) {
                                emails.push(email);
                            }
                        }
                    }
                }

                if (!usuarioMatriz) {
                    emails.push("rodrio.ramos@castilho.com.br");
                }

                return emails.join("; ");
            } catch (error) {
                return "";
            }
        }
    }

    function handleChangeDivergencias(CODUSUARIO, target, value) {
        setDivergencias((prevDivergencias) => {
            return prevDivergencias.map((e) => {
                if (e.CODUSUARIO == CODUSUARIO) {
                    return { ...e, [target]: value };
                } else {
                    return e;
                }
            });
        });
    }

    async function DisparaDivergencias() {
        var list = [];

        for (const Divergencia of Divergencias) {
            if (Divergencia.CheckEnvio) {
                list.push(Divergencia);
            }
        }

        await NotificaDivergencias(list);
        handleBuscaDivergencias();
    }

    function RenderizaDivergencias() {
        var lista = [];

        for (const Divergencia of Divergencias) {
            lista.push(
                <DivergenciasUsuario
                    key={Divergencia.ID}
                    Usuario={Divergencia.CODUSUARIO}
                    Divergencias={Divergencia.Divergencias}
                    EmailCopia={Divergencia.EmailCopia}
                    Observacao={Divergencia.Observacao}
                    CheckEnvio={Divergencia.CheckEnvio}
                    onChangeDivergencias={handleChangeDivergencias}
                />
            );
        }

        return lista;
    }

    return (
        <>
            <FiltroListaDivergencias
                Filtros={Filtros}
                onChangeFiltro={(target, value) => handleChangeFiltro(target, value)}
                onBuscaDivergencias={handleBuscaDivergencias}
                Permissao={Permissao}
            />
            <Panel Title="Enviar Notificações">
                <div>{RenderizaDivergencias()}</div>
                <br />
                <button className="btn btn-success" style={{ margin: "auto" }} onClick={DisparaDivergencias}>
                    Notificar
                </button>
            </Panel>
        </>
    );
}
function DivergenciasUsuario({ Usuario, Divergencias, EmailCopia, Observacao, CheckEnvio, onChangeDivergencias }) {
    var id = makeid(6);

    function renderizaDivergencias() {
        var DivergenciasAtivas = [];
        var DivergenciasCanceladas = [];
        var i = 0;
        for (const Divergencia of Divergencias) {
            i++;
            if (Divergencia.STATUS == "true") {
                DivergenciasAtivas.push(
                    <tr key={i}>
                        <td>{Divergencia.NUMEROMOV}</td>
                        <td>{FormataDataParaDDMMYYYY(Divergencia.DATAEMISSAO)}</td>
                        <td>{Divergencia.CODTMV}</td>
                        <td>{Divergencia.CODFILIAL}</td>
                        <td>{FormataDataParaDDMMYYYY(Divergencia.CREATEDON)}</td>
                        <td>
                            {Divergencia.CGCCFO} <br /> {Divergencia.FORNECEDOR}
                        </td>
                        <td>{Divergencia.CATEGORIA}</td>
                    </tr>
                );
            } else {
                DivergenciasCanceladas.push(
                    <tr key={i}>
                        <td>{Divergencia.NUMEROMOV}</td>
                        <td>{FormataDataParaDDMMYYYY(Divergencia.DATAEMISSAO)}</td>
                        <td>{Divergencia.CODTMV}</td>
                        <td>{Divergencia.CODFILIAL}</td>
                        <td>{FormataDataParaDDMMYYYY(Divergencia.CREATEDON)}</td>
                        <td>
                            {Divergencia.CGCCFO} <br /> {Divergencia.FORNECEDOR}
                        </td>
                        <td>{Divergencia.CATEGORIA}</td>
                    </tr>
                );
            }
        }

        return (
            <>
                {DivergenciasAtivas.length > 0 && (
                    <div>
                        <h3>Divergências</h3>
                        <table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Número</th>
                                    <th>Emissão</th>
                                    <th>T.M.</th>
                                    <th>Filial</th>
                                    <th>Data Divergência</th>
                                    <th>Fornecedor</th>
                                    <th>Divergência</th>
                                </tr>
                            </thead>
                            <tbody>{DivergenciasAtivas}</tbody>
                        </table>
                    </div>
                )}
                {DivergenciasCanceladas.length > 0 && (
                    <div>
                        <h3>Divergências Canceladas</h3>
                        <table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Número</th>
                                    <th>Emissão</th>
                                    <th>T.M.</th>
                                    <th>Filial</th>
                                    <th>Data Divergência</th>
                                    <th>Fornecedor</th>
                                    <th>Divergência</th>
                                </tr>
                            </thead>
                            <tbody>{DivergenciasCanceladas}</tbody>
                        </table>
                    </div>
                )}
            </>
        );
    }

    return (
        <Panel Title={Usuario}>
            <div className="row">
                <div className="col-md-12">
                    <div style={{ width: "fit-content", textAlign: "center", margin: "auto" }}>
                        <div className="switch switch-success">
                            <input
                                className="switch-input"
                                type="checkbox"
                                id={"CheckEnviarDivergencia_" + id}
                                checked={CheckEnvio}
                                onChange={(e) => onChangeDivergencias(Usuario, "CheckEnvio", e.target.checked)}
                            />
                            <label className="switch-button" htmlFor={"CheckEnviarDivergencia_" + id}>
                                Toggle
                            </label>
                        </div>
                        <br />
                        <label htmlFor={"CheckEnviarDivergencia_" + id}>Enviar Divergências?</label>
                    </div>
                </div>
            </div>
            {CheckEnvio == true && (
                <div>
                    <div className="row">
                        <div className="col-md-12">
                            <label htmlFor={"EmailCopia_" + id} style={{ width: "100%" }}>
                                E-mails em cópia:
                            </label>
                            <input
                                type="text"
                                id={"EmailCopia_" + id}
                                className="form-control"
                                value={EmailCopia}
                                onChange={(e) => {
                                    onChangeDivergencias(Usuario, "EmailCopia", e.target.value);
                                }}
                            />
                        </div>
                    </div>
                    <br />
                    <div>{renderizaDivergencias()}</div>
                    <br />
                    <div className="row">
                        <div className="col-md-12">
                            <label htmlFor={"textObeservacoes" + id}>Observações: </label>
                            <textarea
                                id={"textObeservacoes" + id}
                                rows="4"
                                className="form-control"
                                value={Observacao}
                                onChange={(e) => onChangeDivergencias(Usuario, "Observacao", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </Panel>
    );
}


// DASHBOARDS
function DashboardDivergencias({ Permissao }) {
    const [Filtros, setFiltros] = useState({
        FiltroObra: "Todos",
        FiltroUsuario: "Todos",
        FiltroTipoDeMovimento: "Todos",
        FiltroPeriodo: "Lancamento",
        FiltroPeriodoInicio: moment().subtract(1, "year"),
        FiltroPeriodoFim: moment(),
        FiltroStatus: "Ativo"
    });

    const [Divergencias, setDivergencias] = useState([]);

    function handleChangeFiltro(target, value) {
        setFiltros((prevFiltros) => ({
            ...prevFiltros,
            [target]: value
        }));
    }

    async function handleBuscaDivergencias() {
        var filtros = {
            Obra: Filtros.FiltroObra,
            Usuario: Filtros.FiltroUsuario,
            TipoDeMovimento: Filtros.FiltroTipoDeMovimento,
            Periodo: Filtros.FiltroPeriodo,
            PeriodoInicio: Filtros.FiltroPeriodoInicio,
            PeriodoFim: Filtros.FiltroPeriodoFim,
            Status: Filtros.FiltroStatus
        };

        setDivergencias(await BuscaDivergencias(filtros));
    }

    return (
        <div>
            <FiltroListaDivergencias
                Filtros={Filtros}
                onChangeFiltro={(target, value) => handleChangeFiltro(target, value)}
                onBuscaDivergencias={handleBuscaDivergencias}
                Permissao={Permissao}
            />

            <Panel Title={"Gráficos"}>
                {Divergencias.length > 0 && (
                    <>
                        <div className="row">
                            <div className="col-md-2"></div>
                            <div className="col-md-8">
                                <ComponenteChartQuantidadePorDataDeEmissao Divergencias={Divergencias} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-4">
                                <ComponenteChartQuantidadePorCategoria Divergencias={Divergencias} />
                            </div>
                            <div className="col-md-4">
                                <ComponenteChartQuantidadePorUsuario Divergencias={Divergencias} />
                            </div>
                        </div>
                    </>
                )}
            </Panel>
        </div>
    );
}
function ComponenteChartQuantidadePorCategoria({ Divergencias }) {
    useEffect(() => {
        ChartQuantidadePorCategoria = new Chart(document.getElementById("DivChartQuantidadePorCategoria"), {
            type: "pie",
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false,
                        labels: {
                            textAlign: "left"
                        }
                    }
                }
            }
        });
    }, []);

    useEffect(() => {
        if (ChartQuantidadePorCategoria) {
            AtualizaChart();
        }
    }, [Divergencias]);

    function AtualizaChart() {
        var [labels, data, backgroundColor] = ExtraiQuantidadePorCategoria();

        ChartQuantidadePorCategoria.data = {
            labels: labels,
            datasets: [
                {
                    label: "# de Divergências",
                    data: data,
                    backgroundColor: backgroundColor
                }
            ]
        };
        ChartQuantidadePorCategoria.update();
    }

    function ExtraiQuantidadePorCategoria() {
        var listCategorias = [];

        for (let i = 0; i < Divergencias.length; i++) {
            const Divergencia = Divergencias[i];
            var found = listCategorias.find((e) => e.label == Divergencia.CATEGORIA);
            if (!found) {
                listCategorias.push({
                    label: Divergencia.CATEGORIA,
                    value: 1
                });
            } else {
                found.value++;
            }
        }

        var labels = [];
        var values = [];
        var backgroundColor = [];
        for (let i = 0; i < listCategorias.length && i < 10; i++) {
            const Categoria = listCategorias[i];
            labels.push(Categoria.label);
            values.push(Categoria.value);
            backgroundColor.push(colors[i]);
        }

        return [labels, values, backgroundColor];
    }

    return (
        <div className="card" style={{ border: "2px black solid" }}>
            <div style={{ width: "50%", margin: "auto" }}>
                <canvas id="DivChartQuantidadePorCategoria"></canvas>
            </div>
            <div className="card-body" style={{ backgroundColor: "lightgray" }}>
                <h3 className="card-title">Quantidade Por Categoria</h3>
                <p className="card-text">TOP 10 Categorias com mais Divergências.</p>
            </div>
        </div>
    );
}
function ComponenteChartQuantidadePorUsuario({ Divergencias }) {
    useEffect(() => {
        ChartQuantidadePorUsuario = new Chart(document.getElementById("DivChartQuantidadePorUsuario"), {
            type: "pie",
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false,
                        labels: {
                            textAlign: "left"
                        }
                    }
                }
            }
        });
    }, []);

    useEffect(() => {
        if (ChartQuantidadePorUsuario) {
            AtualizaChart();
        }
    }, [Divergencias]);

    function AtualizaChart() {
        var [labels, data, backgroundColor] = ExtraiQuantidadePorCategoria();

        ChartQuantidadePorUsuario.data = {
            labels: labels,
            datasets: [
                {
                    label: "# de Divergências",
                    data: data,
                    backgroundColor: backgroundColor
                }
            ]
        };
        ChartQuantidadePorUsuario.update();
    }

    function ExtraiQuantidadePorCategoria() {
        var listCategorias = [];
        for (const Divergencia of Divergencias) {
            var found = listCategorias.find((e) => e.label == Divergencia.CODUSUARIO);
            if (!found) {
                listCategorias.push({
                    label: Divergencia.CODUSUARIO,
                    value: 1
                });
            } else {
                found.value++;
            }
        }

        listCategorias.sort((a, b) => a.value - b.value);

        var labels = [];
        var values = [];
        var backgroundColor = [];
        for (let i = 0; i < listCategorias.length && i < 10; i++) {
            const Categoria = listCategorias[i];
            labels.push(Categoria.label);
            values.push(Categoria.value);
            backgroundColor.push(colors[i]);
        }

        return [labels, values, backgroundColor];
    }

    return (
        <div className="card" style={{ border: "2px black solid" }}>
            <div style={{ width: "50%", margin: "auto" }}>
                <canvas id="DivChartQuantidadePorUsuario"></canvas>
            </div>
            <div className="card-body" style={{ backgroundColor: "lightgray" }}>
                <h3 className="card-title">Quantidade Por Usuário</h3>
                <p className="card-text">TOP 10 usuários com mais Divergências.</p>
            </div>
        </div>
    );
}
function ComponenteChartQuantidadePorDataDeEmissao({ Divergencias }) {
    useEffect(() => {
        ChartQuantidadePorDataDeEmissao = new Chart(document.getElementById("DivChartQuantidadePorEmissao"), {
            type: "line",
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false,
                        labels: {
                            textAlign: "left"
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function (data) {
                                console.log(data[0].raw.x);
                                return TraduzMes(data[0].raw.x);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: "time",
                        time: {
                            unit: "month"
                        },
                        ticks: {
                            callback: function (value, index, ticks) {
                                return TraduzMes(value);
                            }
                        }
                    }
                }
            }
        });
    }, []);

    useEffect(() => {
        if (ChartQuantidadePorDataDeEmissao) {
            AtualizaChart();
        }
    }, [Divergencias]);

    function AtualizaChart() {
        var [data, backgroundColor] = ExtraiQuantidadePorCategoria();

        ChartQuantidadePorDataDeEmissao.data = {
            datasets: [
                {
                    label: "# de Divergências",
                    data: data,
                    backgroundColor: backgroundColor,
                    fill: true
                }
            ]
        };
        ChartQuantidadePorDataDeEmissao.update();
    }

    function ExtraiQuantidadePorCategoria() {
        var labels = [];
        var data = [];
        var i = -1;
        for (const Divergencia of Divergencias) {
            var Mes = Divergencia.DATAEMISSAO.split(" ")[0].split("-")[1];
            var Ano = Divergencia.DATAEMISSAO.split(" ")[0].split("-")[0];
            var label = Ano + "-" + Mes + "-01";
            var found = labels.find((e) => e.label == label);

            if (!found) {
                i++;
                labels.push({
                    ID: i,
                    label: label
                });
                data.push({
                    ID: i,
                    value: 1
                });
            } else {
                data[found.ID].value++;
            }
        }

        var array2 = [];

        for (const label of labels) {
            array2.push({
                x: BuscaEpoch(label.label),
                y: data[label.ID].value
            });
        }

        array2 = array2.sort((a, b) => {
            if (a.x > b.x) {
                return 1;
            } else if (b.x > a.x) {
                return -1;
            } else {
                return 0;
            }
        });

        var values = [];
        var backgroundColor = [];
        var i = 0;
        for (const Categoria of array2) {
            values.push(Categoria);
            backgroundColor.push(colors[i]);
            i++;
        }

        return [values, backgroundColor];
    }

    return (
        <div className="card" style={{ border: "2px black solid" }}>
            <div style={{ width: "100%", margin: "auto" }}>
                <canvas id="DivChartQuantidadePorEmissao"></canvas>
            </div>
            <div className="card-body" style={{ backgroundColor: "lightgray" }}>
                <h3 className="card-title">Quantidade Por Data de Emissão</h3>
                <p className="card-text"></p>
            </div>
        </div>
    );
}


// UTILS
function Item({ ItemIndex, CodigoProduto, Produto, Quantidade, ValorUnit, CODUND }) {
    return (
        <tr>
            <td>
                <span>{ItemIndex + 1}</span>
            </td>
            <td>
                <span>{CodigoProduto + " - " + Produto}</span>
            </td>
            <td>{Quantidade + " " + CODUND}</td>
            <td>
                <MoneySpan value={ValorUnit} QuantidadeDeCasasDecimais={4} />
            </td>
            <td>
                <MoneySpan value={Quantidade * ValorUnit} />
            </td>
        </tr>
    );
}
function Panel({ children, Title, HideAble = false, IniciaFechado = false }) {
    const [BodyShown, setBodyShown] = useState(!IniciaFechado);

    function handleClickDetails(e) {
        if (HideAble) {
            if (BodyShown) {
                $(e.target).closest(".panel").find(".panel-body:first").slideUp();
            } else {
                $(e.target).closest(".panel").find(".panel-body:first").slideDown();
            }

            setBodyShown(!BodyShown);
        }
    }

    return (
        <div className="panel panel-primary">
            <div
                className="panel-heading"
                onClick={(e) => {
                    if (HideAble) {
                        handleClickDetails(e);
                    }
                }}
            >
                {HideAble == true && <div className={"details " + (BodyShown ? "detailsHide" : "detailsShow")}></div>}

                <h4 className="panel-title" style={{ display: "inline-block", verticalAlign: "middle" }}>
                    {Title}
                </h4>
            </div>
            <div className="panel-body" style={{ display: IniciaFechado ? "none" : "block" }}>
                {children}
            </div>
        </div>
    );
}
function CPFCNPJInput({ value, type = "CPF/CNPJ", onChange }) {
    function handleChange(e) {
        var valor = e.target.value;
        valor = valor.replace(/\D/g, "");
        valor = valor.split("");

        if (valor.length <= 11) {
            valor = maskCPF(valor);
        } else {
            valor = maskCNPJ(valor);
        }

        onChange(valor);
    }

    function handleBlur(e) {
        var valor = e.target.value;
        valor = valor.replace(/\D/g, "");
        valor = valor.split("");

        if (valor.length < 11) {
            if (!validaCPF(maskCPF(valor))) {
                FLUIGC.toast({
                    title: "CPF Inválido!",
                    message: "",
                    type: "warning"
                });
                onChange("");
            } else {
                if (!validarCNPJ(maskCNPJ(valor))) {
                    FLUIGC.toast({
                        title: "CNPJ Inválido!",
                        message: "",
                        type: "warning"
                    });
                    onChange("");
                }
            }
        }
    }

    function maskCPF(value) {
        var formatValue = "";
        //098.560.269-46
        //012 345 678 910
        for (const [i, char] of value.entries()) {
            if (i == 3 || i == 6) {
                formatValue += ".";
            } else if (i == 9) {
                formatValue += "-";
            }

            if (i < 11) {
                formatValue += char;
            }
        }

        return formatValue;
    }
    function maskCNPJ(value) {
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

        return formatValue;
    }

    return <input type="text" className="form-control" value={value} onChange={handleChange} onBlur={handleBlur} />;
}
class ProdutoInput extends React.Component {
    render() {
        var options = Produtos;

        return (
            <div>
                <antd.AutoComplete
                    style={{ width: "100%" }}
                    value={this.props.value}
                    onChange={(e) => this.props.onChange(e)}
                    options={options}
                    filterOption={(inputValue, option) => option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}
                />
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
function MoneySpan({ value, QuantidadeDeCasasDecimais = 2 }) {
    value = FormataValorParaMoeda(value);

    function FormataValorParaMoeda(valor) {
        if (isNaN(valor)) {
            return " - ";
        }

        if (valor) {
            valor = parseFloat(valor);
        }

        return valor.toLocaleString("pt-br", {
            minimumFractionDigits: QuantidadeDeCasasDecimais,
            maximumFractionDigits: QuantidadeDeCasasDecimais
        });
    }

    return (
        <div style={{ display: "inline-block" }}>
            R$<span>{value.split(",")[0]},</span>
            <span style={{ fontSize: "80%" }}>{value.split(",")[1]}</span>
        </div>
    );
}
function MoneyInput({ value, onChange, QuantidadeDeCasasDecimais = 2, className, readOnly }) {
    function formatValue(value) {
        if (value) {
            value = value.split(".");
            var int = value[0].toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
            var decimais = value[1] != undefined ? "," + value[1] : "";

            return "R$ " + int + decimais;
        } else {
            return "R$ ";
        }
    }

    function unformatValue(value) {
        value = value.split(".").join("").split(",");
        var inteiros = removeNaoNumericos(value[0]);
        var decimais = value[1];

        if (!inteiros && !decimais) {
            return "";
        } else {
            if (decimais != undefined) {
                decimais = "." + removeNaoNumericos(decimais);
            } else {
                decimais = "";
            }

            value = inteiros + decimais;
            return value;
        }
    }

    function removeNaoNumericos(value) {
        if (value != undefined && value != null) {
            return value.replace(/[^0-9]/g, "");
        } else {
            return false;
        }
    }

    function handleChange(e) {
        onChange(unformatValue(e.target.value));
    }

    function handleBlur(e) {
        var value = e.target.value.split(",");
        var inteiros = removeNaoNumericos(value[0]);
        var decimais = removeNaoNumericos(value[1]);

        if (!inteiros && !decimais) {
            onChange("");
        } else {
            if (decimais != false) {
                decimais = (decimais + "0000000000").substring(0, QuantidadeDeCasasDecimais);
            } else {
                decimais = "0000000000".substring(0, QuantidadeDeCasasDecimais);
            }
            value = inteiros + "." + decimais;

            onChange(value);
        }
    }

    return (
        <input type="text" value={formatValue(value)} className={"form-control " + className} readOnly={readOnly} placeholder="R$" onChange={handleChange} onBlur={handleBlur} />
    );
}