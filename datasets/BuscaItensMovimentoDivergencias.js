function defineStructure() {

}
function onSync(lastSyncDate) {

}
function createDataset(fields, constraints, sortFields) {
    var CODCOLIGADA = null;
    var IDMOV = null;
    var myQuery = null;


    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {
            if (constraints[i].fieldName == "CODCOLIGADA") {
                CODCOLIGADA = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "IDMOV") {
                IDMOV = constraints[i].initialValue;
            }
        }
    }


    if (CODCOLIGADA != null && IDMOV != null) {
        myQuery =
            "SELECT\
            TITMMOV.NSEQITMMOV, TITMMOV.QUANTIDADE, TITMMOV.PRECOUNITARIO as VALORUNITARIO, TPRODUTO.CODIGOPRD as CODIGOPRODUTO, TPRODUTO.NOMEFANTASIA as PRODUTO, TPRODUTODEF.CODUNDCONTROLE as CODUND\
        FROM\
            TMOV\
            INNER JOIN TITMMOV ON TMOV.CODCOLIGADA = TITMMOV.CODCOLIGADA AND TMOV.IDMOV = TITMMOV.IDMOV\
            INNER JOIN TPRODUTO ON TPRODUTO.IDPRD = TITMMOV.IDPRD AND TPRODUTO.CODCOLPRD = TITMMOV.CODCOLIGADA\
            INNER JOIN TPRODUTODEF ON TPRODUTO.IDPRD = TPRODUTODEF.IDPRD AND TPRODUTO.CODCOLPRD = TPRODUTODEF.CODCOLIGADA\
        WHERE\
            TMOV.CODCOLIGADA = " + CODCOLIGADA + " AND TMOV.IDMOV = " + IDMOV;

        log.info("myQueryItensDivergencias:" + myQuery);

    return executaQuery(myQuery);

    }

} function onMobileSync(user) {

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