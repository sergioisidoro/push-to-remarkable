(function() {
  /**
  * Check and set a global guard variable.
  * If this content script is injected into the same page again,
  * it will do nothing next time.
  */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;
  
  
  browser.runtime.onMessage.addListener((message) => {
    console.log("Got a message");
    
    if (message.command === "register") {
      
      console.log("Let's register a device");
      StorageToken = browser.storage.local.get('remarkable_token')
      
      StorageToken.then((res) => {
        if (res.remarkable_token) {
          console.log("Already registered!");
        }
        else {
          console.log("Not registered... registering...")
          client = remarkableClient(null)
          console.log("API call...")
          register_promis = client.register(message.otp)
          register_promis.done((res) => {
            console.log(res);
            browser.storage.local.set({
              remarkable_token: res.responseText
            });
          });
        };
      });
    }
    
    else if (message.command === "push") {
      console.log("Push command");
      StorageToken = browser.storage.local.get('remarkable_token')

      StorageToken.then((res) => {
        if (res.remarkable_token) {
          console.log("Let's push things");
    
          var documentClone = document.cloneNode(true); 
          var article = new Readability(documentClone).parse();
          
          var filename = 'index.html';
          var title = article.title

          content_blob = new Blob([article.content], {type: "application/html;charset=utf-8"})
          file = new File([content_blob], filename, {type: "application/html;charset=utf-8"})

          var formData = new FormData();
          formData.append('files', content_blob, filename);
  
          console.log("printing")

          var xhr = new XMLHttpRequest();
          xhr.onload = function () {
              console.log("Prepare Zip");
              
              client = remarkableClient(res.remarkable_token) 
              client.create_doc(this.response)
          }
          xhr.open('POST', "https://gotenberg.trebaruna.com/convert/html");
          xhr.responseType = 'blob';
          xhr.send(formData);  
      }
      else {
        console.log("I don't have the token :(");
      }
    });
  
  };
});
})();