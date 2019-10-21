

/**
* Listen for clicks on the buttons, and send the appropriate message to
* the content script in the page.
*/
function listenForThings() {
    // storage.StorageArea.get('remarkable-token')

    console.log("Checking local storage")
    StorageToken = browser.storage.local.get('remarkable_token')

    StorageToken.then((res) => {
        if (res.remarkable_token) {
            console.log("I have a token");
            document.querySelector("#push-div").classList.remove("hidden")
            document.querySelector("#register-div").classList.add("hidden") 
        }
        else {
            console.log("I Do not a token");
            document.querySelector("#push-div").classList.add("hidden")
            document.querySelector("#register-div").classList.remove("hidden")
        }
      });

      function show_push() {
        document.querySelector("#push-div").classList.remove("hidden")
        document.querySelector("#register-div").classList.add("hidden")
    };
    
    document.addEventListener("click", (e) => {
        console.log("Oh, a click!");
         
        function register(tabs) {
            otp_code = document.querySelector('input[name="otp"]').value;

            browser.tabs.sendMessage(tabs[0].id, {
                command: "register",
                otp: otp_code,
            });
            show_push()
        };
        
        function push(tabs) {
            browser.tabs.sendMessage(tabs[0].id, {
                command: "push",
            });
        };

        if (e.target.classList.contains("register")) {
            console.log("It was a register click!");
            browser.tabs.query({active: true, currentWindow: true})
            .then(register)
            .catch(reportError);
        }
        else if (e.target.classList.contains("push")) {
            console.log("It was a push click!");
            browser.tabs.query({active: true, currentWindow: true})
            .then(push)
            .catch(reportError);
        }
    });

    function reportError(error) {
        console.error(`Woopsie daisy: ${error}`);
      }
  
}

/**
* There was an error executing the script.
* Display the popup's error message, and hide the normal UI.
*/
function reportExecuteScriptError(error) {
    document.querySelector("#popup-content").classList.add("hidden");
    document.querySelector("#error-content").classList.remove("hidden");
    console.error(`Something has went wrong...: ${error.message}`);
}

/**
* When the popup loads, inject a content script into the active tab,
* and add a click handler.
* If we couldn't inject the script, handle the error.
*/
browser.tabs.executeScript({file: "/content_scripts/main.js"})
.then(listenForThings)
.catch(reportExecuteScriptError);