require('geckodriver');
require('chromedriver');
const {Builder, By, Key, until} = require('selenium-webdriver');
const fs = require('fs');
 
(async function example() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {

    var lista = [];
    var iAno = null;
    var iInfo = null;
    
    //faz carregamento da pagina
    await driver.get('https://pt.wikipedia.org/wiki/Lista_de_tornados_no_Brasil');
    await driver.wait(until.titleIs('Lista de tornados no Brasil – Wikipédia, a enciclopédia livre'), 1000);

    let cssComponents = '#bodyContent>#mw-content-text>.mw-parser-output';
    let componenets = await driver.wait(until.elementLocated(By.css(cssComponents)), 10000).findElements(By.tagName("*"));

    for (let i = 0; i < componenets.length; i++) {

      var name =  await componenets[i].getTagName();

      if (name === "h3") {

        let h3ano = await componenets[i].findElements(By.css("span:nth-of-type(1)"));
        iAno = await h3ano[0].getText();

      } else if (name === "ul") {
        
        let li = await componenets[i].findElements(By.css("ul>li"));
        iInfo = await li[0].getText();

        if (iInfo && iInfo.includes(".[")) {
          let newText = filtro(iInfo);
          let mesText = newText.substr(newText.indexOf(" de "), newText.indexOf(" - ")).split(" ");
          let clearText = newText.substr(newText.indexOf(" - ")+3, newText.length);
          let data = {
            ano: eval(iAno),
            mes: mesText[2],
            dia: eval(newText.substr(0, newText.indexOf(" de"))),
            categoria: filtroCategoria(newText),
            info: clearText,
            cidades: filtroCidade(clearText)
          };
          lista.push(data);
        }

      } 
      
    }

    // console.log(lista);
    fs.writeFile('tornados.json', JSON.stringify(lista), (err) => {
      if (err) throw err;
      console.log('Arquivo criado!');
    }); 

  } finally {
    await driver.quit();
  }
})();

const filtro = (text) => {
  return text
  .substr(0, text.indexOf(".["))
  .replace("ª","")
  .replace("º","");
};

const filtroCategoria = (text) => {
  var palavras = text.split(" ");
  var cat = null;
  palavras.forEach(element => {
    if (element[0]==="F" && element.length===2) {
      cat = element;
    }
  });
  return cat;
};

const filtroCidade = (text) => {
  const isUpperCase = (string) => /^[A-Z]*$/.test(string);
  var array = [];
  // var newText = text.replace(",","").replace(".","").replace("!","").replace("?","")
  // newText = newText.substr(0,1).toLowerCase()+newText.substr(1,newText.length);
  var newText = text;
  newText = newText.replace(/[0-9]/g, '');
  newText = newText.replace(/,/g, '');
  newText = newText.replace(/\./g, '');
  var palavras = newText.split(" ");
  palavras.forEach((element,index) => {
    if (element.length > 1 && isUpperCase(element.substr(0,1))) {
      array.push({index:index,palavra:element,iteracao:true});
    }
  });
  
  for (let i = 0; i < 5; i++) {
    array = junta(array);
  }

  return array;
};

const junta = (array) => {
  var newArray = [];
  for (let i = 0; i < array.length; i++) {
    if (array[i].iteracao) {
      if ((array[i+1]!=null) && Math.abs((array[i].index-array[i+1].index)) === 1) {
        array[i].palavra = array[i].palavra+" "+array[i+1].palavra;
        array[i].index = array[i+1].index;
        array[i+1].iteracao = false;
      }
      newArray.push(array[i]);
    }
  }
  return newArray;
};