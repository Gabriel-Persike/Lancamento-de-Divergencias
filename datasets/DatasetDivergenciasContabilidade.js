function defineStructure() {

}

function onSync(lastSyncDate) {

}

function createDataset(fields, constraints, sortFields) {
    var [Operacao, Divergencia, CategoriaDivergencia, Movimentos, CancelamentoDivergencia, ID] = ExtraiConstraints(constraints);
    var myQuery = null;

    if (Operacao == "InsertCategoriaDivergencia") {
        myQuery = MontaQueryInsertCategoriaDivergencia(CategoriaDivergencia.GRUPO, CategoriaDivergencia.DESCRICAO);
    }
    else if (Operacao == "InsertDivergencia") {
        myQuery = MontaQueryInsertDivergencia(Divergencia);
    }
    else if (Operacao == "BuscaCategoriaDivergencia") {
        myQuery = MontaQueryBuscaCategoriaDivergencia();
    }
    else if (Operacao == "BuscaDivergencias") {
        myQuery = MontaQueryBuscaDivergencias();
    }
    else if (Operacao == "BuscaMovimentos") {
        myQuery = MontaQueryBuscaMovimentos(Movimentos);
    }
    else if(Operacao == "CancelarDivergencia"){
        myQuery = MontaQueryCancelamentoDaDivergencia(CancelamentoDivergencia);
    }
    else if(Operacao == "AlteraStatusEmailParaEnviado"){
        myQuery = MontaQueryUpdateStatusEmailParaEnviado(ID);
    }
    
    log.info("myQuery: " + myQuery)

    if (Operacao == "BuscaMovimentos") {
        return executaQueryNaCastilhoRM(myQuery);
    }   
    else{
        return executaQueryNaCastilhoCustom(myQuery);
    }
} 

function onMobileSync(user) {

}

function ExtraiConstraints(constraints) {
    var Operacao = null;
    var Divergencia = null;
    var CategoriaDivergencia = null;
    var Movimentos = null;
    var CancelamentoDivergencia = null;
    var ID = null;

    for (i = 0; i < constraints.length; i++) {
        if (constraints[i].fieldName == "Operacao") {
            Operacao = constraints[i].initialValue;
        }
        else if (constraints[i].fieldName == "Divergencia") {
            Divergencia = JSON.parse(constraints[i].initialValue);
        }
        else if (constraints[i].fieldName == "CategoriaDivergencia") {
            CategoriaDivergencia = JSON.parse(constraints[i].initialValue);
        }
        else if (constraints[i].fieldName == "Movimentos") {
            Movimentos = JSON.parse(constraints[i].initialValue);
        }
        else if (constraints[i].fieldName == "CancelamentoDivergencia") {
            CancelamentoDivergencia = JSON.parse(constraints[i].initialValue);
        }
        else if (constraints[i].fieldName == "ID") {
            ID = JSON.parse(constraints[i].initialValue);
        }
    }

    return [Operacao, Divergencia, CategoriaDivergencia, Movimentos, CancelamentoDivergencia, ID];
}

function MontaQueryInsertDivergencia(Divergencia) {
    var query =
        "INSERT INTO DIVERGENCIASCONTABILIDADE\
        (IDMOV, CODCOLIGADA, CATEGORIA, OBS_DIVERG, STATUS, MOTIVO_CANC, EMAIL_PEND, CREATEDON, CREATEDBY, MODIFIEDON, MODIFIEDBY)\
        VALUES\
        (" + Divergencia.IDMOV + ", " + Divergencia.CODCOLIGADA + ", " + Divergencia.CATEGORIA + ", '" + JSON.stringify(Divergencia.OBS_DIVERG) + "', " +
        Divergencia.STATUS + ", '" + Divergencia.MOTIVO_CANC + "', " + Divergencia.EMAIL_PEND + ", '" + Divergencia.CREATEDON + "', '" + Divergencia.CREATEDBY + "', '" + Divergencia.MODIFIEDON + "', '" + Divergencia.MODIFIEDBY + "')";

    return query;
}

function MontaQueryInsertCategoriaDivergencia(GRUPO, DESCRICAO) {
    var query =
        "INSERT INTO CATEGORIASDIVERGENCIASCONTABILIDADE\
        (GRUPO, DESCRICAO)\
        VALUES\
        ('" + GRUPO + "', '" + DESCRICAO + "')";

    return query;
}

function MontaQueryBuscaCategoriaDivergencia(){
    var myQuery = 
    "SELECT * FROM CATEGORIASDIVERGENCIASCONTABILIDADE";

    return myQuery;
}

function MontaQueryBuscaDivergencias(){
    return "SELECT \
        DIVERGENCIASCONTABILIDADE.ID, \
        DIVERGENCIASCONTABILIDADE.CODCOLIGADA, \
        DIVERGENCIASCONTABILIDADE.IDMOV, \
        DIVERGENCIASCONTABILIDADE.CATEGORIA as 'CATEGORIAID', \
        CATEGORIASDIVERGENCIASCONTABILIDADE.DESCRICAO as CATEGORIA, \
        CATEGORIASDIVERGENCIASCONTABILIDADE.GRUPO as CATEGORIAGRUPO, \
        DIVERGENCIASCONTABILIDADE.STATUS,\
        DIVERGENCIASCONTABILIDADE.OBS_DIVERG,\
        DIVERGENCIASCONTABILIDADE.MOTIVO_CANC, \
        DIVERGENCIASCONTABILIDADE.EMAIL_PEND,\
        DIVERGENCIASCONTABILIDADE.CREATEDON,\
        DIVERGENCIASCONTABILIDADE.MODIFIEDON,\
        DIVERGENCIASCONTABILIDADE.CREATEDBY,\
        DIVERGENCIASCONTABILIDADE.MODIFIEDBY\
    FROM DIVERGENCIASCONTABILIDADE\
        INNER JOIN CATEGORIASDIVERGENCIASCONTABILIDADE ON CATEGORIASDIVERGENCIASCONTABILIDADE.ID = DIVERGENCIASCONTABILIDADE.CATEGORIA";
}

function MontaQueryBuscaMovimentos(Movimentos){
    var MovimentosPorColigada = [];

    //Agrupa os Movimentos por CODCOLIGADA
    for (var i = 0; i < Movimentos.length; i++) {
        var Movimento = Movimentos[i];

        if (MovimentosPorColigada[Movimento.CODCOLIGADA] == undefined) {
            MovimentosPorColigada[Movimento.CODCOLIGADA] = {CODCOLIGADA: Movimento.CODCOLIGADA, Movimentos:[]};
        }

        MovimentosPorColigada[Movimento.CODCOLIGADA].Movimentos.push(Movimento.IDMOV);
    }

    //Cria a Constraint dos IDMOVs por cada CODCOLIGADA
    var WhereCODCOLIGADAAndIDMOV = [];
    for (var i = 0; i < MovimentosPorColigada.length; i++) {
        var MovimentoPorColigada = MovimentosPorColigada[i];

        if (MovimentoPorColigada && MovimentoPorColigada.Movimentos.length>0) {
            WhereCODCOLIGADAAndIDMOV.push("(TMOV.CODCOLIGADA = " + MovimentoPorColigada.CODCOLIGADA + " AND TMOV.IDMOV in (" + MovimentoPorColigada.Movimentos.join(",") + "))");
        }
    }
    WhereCODCOLIGADAAndIDMOV = WhereCODCOLIGADAAndIDMOV.join(" OR ");
    
    var myQuery = 
    "SELECT TMOV.CODCOLIGADA, GCOLIGADA.NOME as COLIGADA, TMOV.IDMOV,  GFILIAL.CODFILIAL, GFILIAL.NOME as FILIAL, FCFO.NOME as FORNECEDOR, FCFO.CGCCFO, TMOV.NUMEROMOV, TMOV.CODTMV, TMOV.VALORBRUTO, TMOV.DATAEMISSAO, TMOV.USUARIOCRIACAO as CODUSUARIO, TLOC.NOME as OBRA\
    FROM TMOV\
        INNER JOIN GCOLIGADA ON TMOV.CODCOLIGADA = GCOLIGADA.CODCOLIGADA\
        INNER JOIN GFILIAL ON TMOV.CODCOLIGADA = GFILIAL.CODCOLIGADA AND TMOV.CODFILIAL = GFILIAL.CODFILIAL\
        INNER JOIN FCFO ON (TMOV.CODCOLIGADA = FCFO.CODCOLIGADA OR FCFO.CODCOLIGADA = 0) AND TMOV.CODCFO = FCFO.CODCFO\
        INNER JOIN TLOC ON TMOV.CODLOC = TLOC.CODLOC AND TMOV.CODCOLIGADA = TLOC.CODCOLIGADA  AND TMOV.CODFILIAL = TLOC.CODFILIAL\
    WHERE (" + WhereCODCOLIGADAAndIDMOV + ") "; 


    return myQuery;
}

function MontaQueryCancelamentoDaDivergencia(CancelamentoDivergencia){
    var myQuery = 
    "UPDATE DIVERGENCIASCONTABILIDADE\
    SET STATUS = 0,\
    MOTIVO_CANC = '" + CancelamentoDivergencia.Motivo + "',\
    EMAIL_PEND = " + CancelamentoDivergencia.EMAIL_PEND + ",\
    MODIFIEDON = '" + CancelamentoDivergencia.MODIFIEDON + "',\
    MODIFIEDBY = '" + CancelamentoDivergencia.MODIFIEDBY + "'\
    WHERE ID = " + CancelamentoDivergencia.ID;


    return myQuery;
}

function MontaQueryUpdateStatusEmailParaEnviado(ID) {
    var myQuery = 
    "UPDATE DIVERGENCIASCONTABILIDADE\
    SET\
    EMAIL_PEND = 0\
    WHERE ID = " + ID;

    return myQuery;
}

function executaQueryNaCastilhoRM(query) {
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

function executaQueryNaCastilhoCustom(query) {
    var newDataset = DatasetBuilder.newDataset();
    var dataSource = "/jdbc/CastilhoCustom";
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var created = false;
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