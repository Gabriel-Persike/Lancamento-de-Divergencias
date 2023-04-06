//Aprovação de Movimentos - Consulta dados do movimento via consulta SQL
function defineStructure() {

}
function onSync(lastSyncDate) {

}
function createDataset(fields, constraints, sortFields) {

	var newDataset = DatasetBuilder.newDataset();
    var dataSource = "/jdbc/FluigRM"; //nome da conexão usada no standalone
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var created = false;
    var pIdmov = null;
	var pCodcoligada = null;
	var pSismaRM = null;
    var myQuery = null;
    
    if (constraints != null) 
    {
        for (i = 0; i < constraints.length; i++) {
        	if (constraints[i].fieldName == "pIdmov"){ 
        		pIdmov = constraints[i].initialValue; 
        	}
        	if(constraints[i].fieldName == "pCodcoligada") {
        		pCodcoligada = constraints[i].initialValue; 
        	} 	
        	if(constraints[i].fieldName == "pSismaRM") {
        		pSismaRM = constraints[i].initialValue; 
        	} 	
        }
    }	
	
	
    if (pIdmov != null && pCodcoligada != null && (pSismaRM == null || pSismaRM == false))
    {
     	myQuery = "SELECT\
				concat(GFILIAL.CODFILIAL,' - ',GFILIAL.NOMEFANTASIA) RMnomefilial,\
				tmov.usuariocriacao RMsolicitante,\
				CONCAT(CONVERT(VARCHAR,tmov.horasaida,103),' ',CONVERT(VARCHAR,tmov.horasaida,8)) RMdatacadastro,\
				tmov.numeromov RMnumeromov,\
     			cast(tmov.valorbrutoorig as float) RMvalorBruto,\
     			tmov.codtmv RMtipomov,\
				fcfo.nome RMnomefornecedor,\
                concat(tloc.CODLOC, ' - ', tloc.nome) RMlocalEstoque,                TMOVCOMPL.USUARIO_COMPRADOR RMcomprador,\
				tcpg.nome RMcondPagto,\
				gusuario.email RMsolicitanteEmail,\
     			dexercicionatureza.id_exercicio RMexercicioFiscal\
			FROM tmov(NOLOCK)\
				INNER JOIN fcfo(NOLOCK)				ON fcfo.codcoligada = tmov.codcolcfo AND fcfo.codcfo = tmov.codcfo\
				INNER JOIN tloc(NOLOCK)				ON tloc.codcoligada = tmov.codcoligada AND tloc.codloc = tmov.codloc AND tmov.codfilial = tloc.codfilial\
				INNER JOIN gfilial(NOLOCK)			ON gfilial.codcoligada = tmov.codcoligada AND gfilial.codfilial = tmov.codfilial\
				INNER JOIN tcpg(NOLOCK)				ON tcpg.codcpg = tmov.codcpg AND tcpg.codcoligada = tmov.codcoligada\
                INNER JOIN gusuario(NOLOCK)			ON gusuario.codusuario = tmov.usuariocriacao\
                INNER JOIN tmovcompl(NOLOCK)        ON tmov.CODCOLIGADA = TMOVCOMPL.CODCOLIGADA AND tmov.IDMOV = TMOVCOMPL.IDMOV\
     		LEFT OUTER JOIN dexercicionatureza ON gfilial.codcoligada = dexercicionatureza.codcoligada AND gfilial.codfilial = dexercicionatureza.codfilial AND  dexercicionatureza.datafinal > tmov.dataemissao\
			WHERE\
				tmov.codcoligada = "+pCodcoligada+" AND tmov.idmov = "+pIdmov;
    }
    else if (pIdmov != null && pCodcoligada != null && pSismaRM == 'true')
    {
     	myQuery = "SELECT\
				concat(gfilial.codfilial,' - ',gfilial.nomefantasia) AS codFilial,\
				concat(tloc.codloc,' - ',tloc.nome) AS localEstoque,\
				tmov.usuariocriacao AS usuarioCriacao,\
				tmov.codusuario AS solicitante,\
				CONVERT(VARCHAR,tmov.dataentrega,103) AS przData,\
				'130 - 30 DIAS' AS condicaoPgto,\
				'001 - Cheque Curitiba' AS formaPgto,\
				tmovcompl.usuario_comprador AS obraOuMatriz,\
     			tmovhistorico.historicolongo AS locEntrega2, \
     			CASE WHEN (tmovcompl.tipo_solicitacao = 'TER') THEN '1.1.07' \
     			     ELSE '1.1.02' END AS tpmov, \
     			tmovcompl.idsisma AS idSismaRM \
			FROM tmov(NOLOCK)\
				INNER JOIN tloc(NOLOCK)				ON tloc.codcoligada = tmov.codcoligada AND tloc.codloc = tmov.codloc AND tmov.codfilial = tloc.codfilial\
				INNER JOIN gfilial(NOLOCK)			ON gfilial.codcoligada = tmov.codcoligada AND gfilial.codfilial = tmov.codfilial\
				INNER JOIN gusuario(NOLOCK)			ON gusuario.codusuario = tmov.usuariocriacao\
     			INNER JOIN tmovcompl(NOLOCK)	    ON tmovcompl.codcoligada = tmov.codcoligada AND tmovcompl.idmov = tmov.idmov\
				INNER JOIN tmovhistorico(NOLOCK)	ON tmovhistorico.codcoligada = tmov.codcoligada AND tmovhistorico.idmov = tmov.idmov\
			WHERE\
				tmov.codcoligada = "+pCodcoligada+" AND tmov.idmov = "+pIdmov;
    }

    try {
        var conn = ds.getConnection();
        var stmt = conn.createStatement();
        log.info("MY QUERY ====> " + myQuery);
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
                    Arr[i - 1] = "null";
                }
            }
            newDataset.addRow(Arr);
        }
    } catch (e) {
        log.error("ERRO==============> " + e.message);
        newDataset.addColumn("coluna");
        newDataset.addRow("deu erro!");
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