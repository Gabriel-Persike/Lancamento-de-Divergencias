function defineStructure() {

}
function onSync(lastSyncDate) {

}
function createDataset(fields, constraints, sortFields) {
    var myQuery = null,
        operacao = null,
        usuario = null,
        codcoligada = null,
        idmov = null,
        cgccfo = null,
        codigocontrato = null;

    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {
            if (constraints[i].fieldName == "operacao") {
                operacao = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "usuario") {
                usuario = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "codcoligada") {
                codcoligada = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "idmov") {
                idmov = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "cgccfo") {
                cgccfo = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "codigocontrato") {
                codigocontrato = constraints[i].initialValue;
            }
        }
    }


    if (operacao == "BuscaColigadas") {
        myQuery = 
        "SELECT DISTINCT\
            TFCOLIGADA.CODCOLIGADA,\
            TFCOLIGADA.NOMEFANTASIA\
        FROM viewPerfilUsuarioAprovacao\
        INNER JOIN TFCOLIGADA ON viewPerfilUsuarioAprovacao.codcoligada = TFCOLIGADA.codcoligada\
        WHERE codusuarioFluig = '" + usuario + "'";
    }
    else if(operacao == "BuscaMovimento"){
        myQuery = 
        "SELECT\
            TMOV.CODCOLIGADA as CODCOLIGADA,\
            TFCOLIGADA.NOMEFANTASIA as COLIGADA,\
            TMOV.IDMOV,\
            TMOV.CODFILIAL as CODFILIAL,\
            GFILIAL.NOMEFANTASIA as FILIAL,\
            TMOV.CODTMV,\
            FCFO.CGCCFO,\
            FCFO.NOMEFANTASIA as FORNECEDOR,\
            TMOV.VALORBRUTO as VALOR,\
            TMOV.DATAEMISSAO,\
            TMOV.NUMEROMOV\
        FROM TMOV\
            INNER JOIN TFCOLIGADA ON TMOV.CODCOLIGADA = TFCOLIGADA.CODCOLIGADA\
            INNER JOIN GFILIAL ON TMOV.CODCOLIGADA = GFILIAL.CODCOLIGADA AND TMOV.CODFILIAL = GFILIAL.CODFILIAL\
            INNER JOIN FCFO ON (TMOV.CODCOLIGADA = FCFO.CODCOLIGADA OR FCFO.CODCOLIGADA = 0) AND TMOV.CODCFO = FCFO.CODCFO\
        WHERE\
            TMOV.CODCOLIGADA = " + codcoligada + "\
            AND TMOV.IDMOV = " + idmov;
    }
    else if(operacao == "BuscaMovimentoOrigem"){
        myQuery = 
        "SELECT\
            TMOV.CODCOLIGADA as CODCOLIGADA,\
            TFCOLIGADA.NOMEFANTASIA as COLIGADA,\
            TMOV.IDMOV,\
            TMOV.CODFILIAL as CODFILIAL,\
            GFILIAL.NOMEFANTASIA as FILIAL,\
            TMOV.CODTMV,\
            FCFO.CGCCFO,\
            FCFO.NOMEFANTASIA as FORNECEDOR,\
            TMOV.VALORBRUTO as VALOR,\
            TMOV.DATAEMISSAO,\
            TMOV.NUMEROMOV\
        FROM TMOVRELAC\
            INNER JOIN TMOV ON TMOVRELAC.CODCOLDESTINO = TMOV.CODCOLIGADA AND TMOVRELAC.IDMOVORIGEM = TMOV.IDMOV\
            INNER JOIN TFCOLIGADA ON TMOV.CODCOLIGADA = TFCOLIGADA.CODCOLIGADA\
            INNER JOIN GFILIAL ON TMOV.CODCOLIGADA = GFILIAL.CODCOLIGADA AND TMOV.CODFILIAL = GFILIAL.CODFILIAL\
            INNER JOIN FCFO ON (TMOV.CODCOLIGADA = FCFO.CODCOLIGADA OR FCFO.CODCOLIGADA = 0) AND TMOV.CODCFO = FCFO.CODCFO\
        WHERE\
            TMOVRELAC.IDMOVDESTINO = " + idmov + "\
            AND TMOVRELAC.CODCOLDESTINO = " + codcoligada;
    }
    else if(operacao == "BuscaFornecedor"){
        myQuery =
        "SELECT FCFO.NOMEFANTASIA as FORNECEDOR, FCFO.CGCCFO as CNPJ FROM FCFO WHERE FCFO.CGCCFO = '" + cgccfo + "'";
    }
    else if(operacao == "BuscaTransportadora"){
        myQuery = 
        "SELECT NOME, CGC, CIDADE, CODETD FROM TTRA WHERE INATIVO = 0 AND CODCOLIGADA = 1";
    }
    else if(operacao == "BuscaItensMovimento"){
        myQuery = 
        "SELECT\
            TITMMOV.IDMOV,\
            TITMMOV.NSEQITMMOV,\
            TPRODUTO.CODIGOPRD as PRODUTO,\
            TPRODUTO.DESCRICAO as DESCPRODUTO,\
            TITMMOV.QUANTIDADE,\
            TITMMOV.PRECOUNITARIO,\
            TITMMOV.VALORBRUTOITEM,\
            TITMMOVHISTORICO.HISTORICOCURTO,\
            TITMMOV.CODUND\
        FROM TITMMOV\
            INNER JOIN TPRODUTO ON TPRODUTO.CODCOLPRD = TITMMOV.CODCOLIGADA AND TPRODUTO.IDPRD = TITMMOV.IDPRD\
            INNER JOIN TITMMOVHISTORICO ON TITMMOVHISTORICO.CODCOLIGADA = TITMMOV.CODCOLIGADA AND TITMMOVHISTORICO.IDMOV = TITMMOV.IDMOV AND TITMMOVHISTORICO.NSEQITMMOV = TITMMOV.NSEQITMMOV\
            INNER JOIN TMOV ON TMOV.CODCOLIGADA = TITMMOV.CODCOLIGADA AND TMOV.IDMOV = TITMMOV.IDMOV\
        WHERE TITMMOV.IDMOV = " + idmov + " AND TITMMOV.CODCOLIGADA = " + codcoligada + " AND TMOV.CODTMV IN ('1.2.01', '1.2.08')";
    }
    else if(operacao == "BuscaContrato"){
        myQuery =
        "SELECT TCNT.CODIGOCONTRATO, TSTACNT.DESCRICAO as STATUS, TTCN.DESCRICAO as TIPO, TCNT.NOME, FCFO.NOMEFANTASIA as FORNECEDOR, FCFO.CGCCFO as CNPJ\
		FROM TCNT\
		INNER JOIN FCFO ON FCFO.CODCFO = TCNT.CODCFO AND (TCNT.CODCOLIGADA = FCFO.CODCOLIGADA OR FCFO.CODCOLIGADA = 0)\
		INNER JOIN TSTACNT ON TCNT.CODCOLIGADA = TSTACNT.CODCOLIGADA AND TCNT.CODSTACNT = TSTACNT.CODSTACNT\
		INNER JOIN TTCN ON TCNT.CODCOLIGADA = TTCN.CODCOLIGADA AND TCNT.CODTCN = TTCN.CODTCN\
		WHERE CODIGOCONTRATO = '" + codigocontrato + "'";
    }
    else{
        return "Operação desconhecida!";
    }

    log.info("myquery: " + myQuery);

    return executaQuery(myQuery);
}function onMobileSync(user) {

}

function executaQuery(query) {
    var newDataset = DatasetBuilder.newDataset(),
	dataSource = "/jdbc/RM",
	ic = new javax.naming.InitialContext(),
	ds = ic.lookup(dataSource),
    created = false;
    try {
        var conn = ds.getConnection();
        var stmt = conn.createStatement();
        var rs = stmt.executeQuery(query);
        var columnCount = rs.getMetaData().getColumnCount();

        while (rs.next()) {
            if (!created) {
                for (var i = 1; i <= columnCount; i++) {
                    newDataset.addColumn(rs.getMetaData().getColumnName(i));
                }
                created = true;
            }
            var Arr = new Array();
            for (var i = 1; i <= columnCount; i++) {
                var obj = rs.getObject(rs.getMetaData().getColumnName(i));
                if (null != obj) {
                    Arr[i - 1] = rs.getObject(rs.getMetaData().getColumnName(i)).toString();
                } else {
                    Arr[i - 1] = "   -   ";
                }
            }

            newDataset.addRow(Arr);
        }
    } catch (e) {
        log.error("ERRO==============> " + e.message);
        newDataset.addColumn("coluna");
        newDataset.addRow(["deu erro! "]);
        newDataset.addRow([e.message]);
    } finally {
        if (stmt != null) {
            stmt.close();
        }
        if (conn != null) {
            conn.close();
        }
    }
    return newDataset;
}