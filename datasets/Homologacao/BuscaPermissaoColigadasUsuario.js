function defineStructure() {

}
function onSync(lastSyncDate) {

}
function createDataset(fields, constraints, sortFields) {
	var usuario = null,  
    permissaoGeral = false,
    myQuery = null;

    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {
            if (constraints[i].fieldName == "usuario") {
                usuario = constraints[i].initialValue;
            }
            else if(constraints[i].fieldName == "permissaoGeral"){
                permissaoGeral = constraints[i].initialValue;
            }
        }
    }

    if (permissaoGeral == "true") {
        myQuery =
        "SELECT DISTINCT TFCOLIGADA.CODCOLIGADA, TFCOLIGADA.NOMEFANTASIA, CODCCUSTO, perfil FROM viewPerfilUsuarioAprovacao\
        INNER JOIN TFCOLIGADA ON TFCOLIGADA.CODCOLIGADA = viewPerfilUsuarioAprovacao.codcoligada\
        INNER JOIN TLOC ON viewPerfilUsuarioAprovacao.perfil = TLOC.NOME AND viewPerfilUsuarioAprovacao.codcoligada = TLOC.CODCOLIGADA\
        INNER JOIN GCCUSTO on TLOC.NOME = GCCUSTO.NOME AND GCCUSTO.ATIVO = 'T'\
        WHERE TLOC.INATIVO = 0  ORDER BY CODCOLIGADA";
    }
    else{
        myQuery =
        "SELECT DISTINCT TFCOLIGADA.CODCOLIGADA, TFCOLIGADA.NOMEFANTASIA, CODCCUSTO, perfil FROM viewPerfilUsuarioAprovacao\
        INNER JOIN TFCOLIGADA ON TFCOLIGADA.CODCOLIGADA = viewPerfilUsuarioAprovacao.codcoligada\
        INNER JOIN TLOC ON viewPerfilUsuarioAprovacao.perfil = TLOC.NOME AND viewPerfilUsuarioAprovacao.codcoligada = TLOC.CODCOLIGADA\
        INNER JOIN GCCUSTO on TLOC.NOME = GCCUSTO.NOME AND GCCUSTO.ATIVO = 'T'\
        WHERE TLOC.INATIVO = 0 AND codusuarioFluig = '" + usuario + "' ORDER BY CODCOLIGADA";
    }

    log.info("myQuery: " + myQuery);
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