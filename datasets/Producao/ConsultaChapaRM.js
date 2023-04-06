function defineStructure() {

}
function onSync(lastSyncDate) {

}

function onMobileSync(user) {

}

function createDataset(fields, constraints, sortFields) 
{
    var newDataset = DatasetBuilder.newDataset();
    var dataSource = "/jdbc/FluigRM"; //nome da conexão usada no standalone
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var created = false;
    var coligada = null;
    if (constraints != null) 
    {
        for (i = 0; i < constraints.length; i++) {
        	if (constraints[i].fieldName == "coligada"){ 
        		coligada = constraints[i].initialValue; 
        	}        	
        }
    }
        
    var myQuery = "SELECT CASE WHEN MAX(chapa) = '0005000' THEN '0005009' ELSE MAX(chapa) END AS chapaRM \
    					FROM pfunc f INNER JOIN ppessoa p ON p.codigo = f.codpessoa WHERE (CAST(chapa AS INTEGER) < 5001 OR CAST(chapa AS INTEGER) > 5009) AND f.codcoligada = "+coligada;
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
                    Arr[i - 1] = "null";
                }
            }
            newDataset.addRow(Arr);
        }
    } catch (e) {
        log.error("ERRO==============> " + e.message);
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