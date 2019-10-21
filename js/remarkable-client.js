var remarkableClient = function (token) {
    console.log("Loading remark. client");
    var self = this;
    self.register_uri = 'https://my.remarkable.com/token/json/2/device/new';
    self.refresh_uri = 'https://my.remarkable.com/token/json/2/user/new';
    self.create_doc_uri = "/document-storage/json/2/upload/request"
    self.update_metadata_uri = "/document-storage/json/2/upload/update-status"
    self.service = "https://document-storage-production-dot-remarkable-production.appspot.com"

    self.token = token
    
    self.ajax = function(uri, method, data) {
        var request = {
            url: uri,
            type: method,
            contentType: "application/json",
            accepts: "application/json",
            cache: false,
            dataType: 'json',
            data: JSON.stringify(data),
            beforeSend: function (xhr) {
                if (self.token) {
                    xhr.setRequestHeader("Authorization", 
                        "Bearer " + self.token);
                };
            },
            error: function(jqXHR) {
                console.log("Oh no, an error! :( - " + jqXHR.status);
                console.log(jqXHR.responseText);
                console.log(jqXHR)
            }
        };
        return $.ajax(request);
    }

    self.uuid_gen = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

    self.set_token = function(data) {
        self.token = data
        return token
    }

    self.register = function(code) {
        console.log("Registering...")
        request_payload = {
            "code": code,
            "deviceDesc": "desktop-windows",
            "deviceID": uuid_gen()
        }
        console.log(request_payload)
        return self.ajax(self.register_uri, 'POST', request_payload);
    }

    self.refresh_token = function () {
        return self.ajax(
            self.refresh_uri, 'POST', request_payload
        );
    }

    self.create_doc = function(blob){
        doc_id = uuid_gen();
        console.log("Creating doc " + doc_id)
        request_payload = [{
            "ID": doc_id,
            "Type": "DocumentType",
            "Version": 1,
        }]
        
        uri = self.service + self.create_doc_uri
        console.log(uri)
        create_request = self.ajax(uri, 'PUT', request_payload);

        console.log("Prep Upload for doc " + doc_id)
        create_request.then((result) => {self.upload_doc(result[0], blob, doc_id)})
    }
    
    self.service_discover = function() {
        $.ajax({
            type: 'GET',
            url: "https://service-manager-production-dot-remarkable-production.appspot.com/service/json/1/document-storage?environment=production&group=auth0%7C5a68dc51cb30df3877a1d7c4&apiVer=2"
        }).done(function(data) {
            if (data.Status == "Ok") {
                console.log("Service OK");
                self.service = "https://" + data.Host
            }
            else {
                console.log("Service discovery failed")
            }
        });
    }

    self.upload_doc = function(doc_object, pdf_blob, name) {

        zip = new JSZip();

        console.log("Adding file " + doc_object.ID + ".pdf");

        file_meta = JSON.stringify({
            extraMeatadata: [],
            fileType: 'pdf',
            lastOpenedPage: 0,
            lineHeight: -1,
            margins: 100,
            textScale: 1,
            transform: []
        }, null, 2)
        
        var reader = new FileReader();

        reader.onload = function () {
            console.log(reader.result);
            zip.file(doc_object.ID + ".pdf", reader.result, {binary: true});
            zip.file(doc_object.ID + ".pagedata", '');
            zip.file(doc_object.ID + ".content", file_meta)
            
            console.log("Zpping");
            
            zip.generateAsync({type: 'blob'}).then(function(blob) {
                console.log("Uploading");
                console.log("Uploading doc  " + doc_object.ID);
        
                $.ajax({
                    type: 'PUT',
                    url: doc_object.BlobURLPut,
                    data: blob,
                    processData: false,
                    contentType: false,
                    beforeSend: function (xhr) {
                        if (self.token) {
                            xhr.setRequestHeader("Content-Type", "");
                            xhr.setRequestHeader("Authorization", 
                                "Bearer " + self.token);
                        };
                    },
                }).done(function(data) {
                    console.log(data)
                    console.log("Upload done");
                    console.log("Updating metadata...");
                    self.update_metadata(doc_object)
                    console.log("Upload done");
                }).catch((err) => {console.log(err)});
            }).catch((err) => {console.log(err)})
        }

        reader.readAsBinaryString(pdf_blob);
    }

    self.update_metadata = function(doc_object) {
        console.log("Updating metadata " + doc_object.ID);

        var date = new Date();
        console.log(date.toISOString())
        request_payload = [{
            "ID": doc_object.ID,
            "Version": 1,
            "VissibleName": doc_object.ID,
            "ModifiedClient": date.toISOString(),
            "CurrentPage": 0,
            "Bookmarked": false,
            "Parent": "",
            "Type": "DocumentType",
        }]
        uri = self.service + self.update_metadata_uri
        self.ajax(uri, 'PUT', request_payload).done(function(data) {
            console.log("Updated metadata done")
            console.log(data)
        }).catch((err) => {console.log(err)});
    }
    return self
};
