function defineStructure() {

}
function onSync(lastSyncDate) {

}
function createDataset(fields, constraints, sortFields) {

    //var codColigada = null;
    var operacao = null;
    var myQuery = null; 

    if (constraints != null) {
        for (i = 0; i < constraints.length; i++) {
            if (constraints[i].fieldName == 'OPERACAO') {
                operacao = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == 'IDLAN') {
                IDLAN = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == 'IDMOV') {
                IDMOV = constraints[i].initialValue;
            }
        }
    }

    if (operacao == 'PuxaLancamento') {
        myQuery = "\
    SELECT\
        FLAN.CODCOLIGADA,\
        IDLAN,\
        FCFO.CODCFO,\
        FCFO.CGCCFO,\
        FCFO.NOMEFANTASIA,\
        FLAN.CODCCUSTO,\
        GCCUSTO.NOME as NOMECC,\
        FLAN.CODDEPARTAMENTO,\
        GDEPTO.NOME,\
        DATAPREVBAIXA,\
        VALORORIGINAL\
    FROM\
        FLAN\
        INNER JOIN GDEPTO ON GDEPTO.CODDEPARTAMENTO = FLAN.CODDEPARTAMENTO AND GDEPTO.CODCOLIGADA = FLAN.CODCOLIGADA\
        INNER JOIN GCCUSTO ON GCCUSTO.CODCCUSTO = FLAN.CODCCUSTO AND GCCUSTO.CODCOLIGADA = FLAN.CODCOLIGADA\
        INNER JOIN FCFO ON FLAN.CODCFO = FCFO.CODCFO\
    WHERE\
        IDLAN='" + IDLAN + "'\
        AND GCCUSTO.ATIVO = 'T'\
        "
    }

    if (operacao == 'PuxaMovimentoAluguel') {
        myQuery = "\
    SELECT\
        FLAN.CODCOLIGADA,\
        IDLAN,\
        FLAN.IDMOV,\
        FCFO.CODCFO,\
        FCFO.CGCCFO,\
        FCFO.NOMEFANTASIA,\
        TMOVRATCCU.CODCCUSTO,\
        GCCUSTO.NOME AS CENTRODECUSTO,\
        TMOVRATDEP.CODDEPARTAMENTO,\
        GDEPTO.NOME AS DEPARTAMENTO,\
        DATAPREVBAIXA,\
        FLAN.VALORORIGINAL\
    FROM \
        FLAN\
        INNER JOIN TMOVRATCCU ON TMOVRATCCU.IDMOV = FLAN.IDMOV\
        INNER JOIN TMOVRATDEP ON TMOVRATDEP.IDMOV = FLAN.IDMOV\
        INNER JOIN GCCUSTO ON GCCUSTO.CODCCUSTO = TMOVRATCCU.CODCCUSTO AND GCCUSTO.CODCOLIGADA = FLAN.CODCOLIGADA\
        INNER JOIN GDEPTO ON TMOVRATDEP.CODDEPARTAMENTO = GDEPTO.CODDEPARTAMENTO AND GDEPTO.CODCOLIGADA = FLAN.CODCOLIGADA\
        INNER JOIN FCFO ON FLAN.CODCFO = FCFO.CODCFO\
    WHERE \
        FLAN.IDMOV = '"+ IDMOV +"'\
        AND GCCUSTO.ATIVO = 'T'\
    "
    }

    if (operacao == 'EmailSuperiores') {
        myQuery = "\
        SELECT * FROM viewPerfilUsuarioAprovacao\
    "
    }

    log.info('myQuery' + myQuery)

    return ExcutaQuery(myQuery);

}function onMobileSync(user) {

}

function ExcutaQuery(myQuery){
    var newDataset = DatasetBuilder.newDataset();
	var dataSource = "/jdbc/FluigRM"; // nome da conexão usada no standalone
	var ic = new javax.naming.InitialContext();
	var ds = ic.lookup(dataSource);
    var created = false;
    try {
		var conn = ds.getConnection();
		var stmt = conn.createStatement();
		var rs = stmt.executeQuery(myQuery);
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
					Arr[i - 1] = "---";
				}
			}
			newDataset.addRow(Arr);
		}

	} catch (e) {
		log.error("ERRO==============> " + e.message);
	} 
    finally {
		if (stmt != null) {
			stmt.close();
		}
		if (conn != null) {
			conn.close();
		}
	}
    return newDataset;
}