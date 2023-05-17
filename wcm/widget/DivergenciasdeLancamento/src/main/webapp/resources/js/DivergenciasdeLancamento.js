var DivergenciasdeLancamento = SuperWidget.extend({
    init: function () {
        console.log("Init");
        BuscaColigadas();
        BuscaDepartamentos();
        setTimeout(() => {
            ReactDOM.render(React.createElement(AppRoot), document.querySelector("#AppRoot"));
        }, 1000);
    }
});