var app = angular.module('eisBoxToolsApp', ['ngFileUpload', 'ui.bootstrap']);
app.constant("moment", moment);

app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
})

app.controller('BoxCreatorController', function($scope, $http) {
  // ADD LOADING SCREEENNNDS
  $scope.master = {};
  $scope.boxCreated = false;
  $scope.waitingForBox = false;

  $http.get("../count/").success(function(res) {
    $scope.boxID = res[0]["COUNT(*)"]+1;
  })

  $scope.update = function(create) {
    $scope.waitingForBox = true;
    $scope.json = angular.copy(create);
    $scope.json.boxID = $scope.boxID;
    $http.post("../boxes/", $scope.json).success(function(res) {
      $scope.boxCreated = true;
      console.log(res[0])
      $scope.waitingForBox = false;
      $scope.currentBox = res[0];
    })
  };

  $scope.reset = function() {
    $scope.create = angular.copy($scope.master);
    $http.get("../count/").success(function(res) {
      $scope.boxID = res[0]["COUNT(*)"];
    })
    $scope.boxCreated = false;
    $scope.currentBox = {};
  };

  $scope.reset();
})

app.controller('BoxViewerController', function($scope, $http) {
  $scope.boxes = {}
  $scope.loading = true


  $scope.currentPage = 0;
  $scope.pageSize = 9;

  $http.get("../boxlist/").success(function(res) {
    $scope.boxes = res;

    $scope.numberOfPages = function() {
          return Math.ceil($scope.boxes.length/$scope.pageSize);
    }

    $scope.loading = false;
  })

})

app.controller('BoxController', function($scope, $http, $location, moment, Upload, $timeout) {
  $scope.box = {}
  $scope.loading = true;
  $scope.fileListLoading = false;

  var boxID = $location.absUrl().split('/').pop();

  $http.get("../boxlist/" + boxID).success(function(res) {
    $scope.box = res[0];

    var lastUpdated = moment($scope.box["LastUpdated"]).format('DD-MM-YYYY');
    var lastSynced  = moment($scope.box["LastSynced"]).format('DD-MM-YYYY');
    var dateCreated = moment($scope.box["DateCreated"]).format('DD-MM-YYYY');
    $scope.box["LastUpdated"] = lastUpdated;
    $scope.box["LastSynced"] = lastSynced;
    $scope.box["DateCreated"] = dateCreated;
    $scope.loading = false;
  })

  $scope.getFileList = function() {
    $scope.fileListLoading = true;

    $http.get("../files/" + $scope.box["BoxID"]).success(function(res) {
      $scope.fileList = res;
      $scope.fileListLoading = false;

      for (f in $scope.fileList) {
        $http({
            url: '../s3/',
            method: "GET",
            params: {key: $scope.fileList[f]["S3URI"]}
         }).success(function(resp) {
           $scope.fileList[f].url = resp;
         })
      }
    })
  }

  $scope.upload = function(file, title, description, category) {
    $scope.uploading = true;

    file.upload = Upload.upload({
      url: '../../files',
      data: {
        file: file,
        title: title,
        description: description,
        cat: category,
        country: $scope.box["Country"],
        language: $scope.box["Language"],
        boxID: $scope.box["BoxID"]
       },
    });

    file.upload.then(function (response) {
      $timeout(function () {
        file.result = response.data;
      });
    }, function (response) {
      if (response.status > 0)
      $scope.errorMsg = response.status + ': ' + response.data;
    }, function (evt) {
      // Math.min is to fix IE which reports 200% sometimes
      file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
      if ( file.progress == 100 ) {
        $scope.uploading = false;

      }
    });
}

  $scope.reset = function() {
    $scope.title = null;
    $scope.description = null;
    $scope.category = null;
    $scope.errorMsg = null;
  }
  $scope.reset();

  $scope.predicate = 'Title';
  $scope.reverse = true;
  $scope.order = function(predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
  };


  $scope.expand = function(file) {
    if ( typeof file.expanded == undefined ) {
      file.expanded = true;
    } else {
      file.expanded = !file.expanded;
    }
  }

  $scope.delete = function(file) {
    console.log("Received Delete")
    file.showDeleting = true;

    $http.delete('../../files/' + file.UID).success(function(res) {
      console.log(res);
      file.showDeleting = false;
      file.deleted = true;
    })
  }

  $scope.toggleDeleteDialog = function(file) {
    if ( typeof file.showDeleteDialog == undefined ) {
      file.showDeleteDialog = true;
    }
    else {
      file.showDeleteDialog = !file.showDeleteDialog;
    }
  }

  $scope.toggleUpdateDialog = function(file) {
    if ( typeof file.showUpdateDialog == undefined ) {
      file.showUpdateDialog = true;
      file.updated = false;
    } else {
      file.showUpdateDialog = !file.showUpdateDialog;
      file.updated = false;
    }
  }

  $scope.updateFormReset = function(form) {
    form.title = null;
    form.description = null;
    form.category = null;
  }

  $scope.updateFile = function (file, title, category, description) {
    var updateData = {};
    updateData.title = title;
    updateData.category = category;
    updateData.description = description;
    updateData.uid = file.UID


    if ( (updateData.title == null || typeof updateData.title == undefined) && (updateData.category == null || typeof updateData.category == undefined) && (updateData.description == null || typeof updateData.description == undefined)) {
      $scope.toggleUpdateDialog(file);
      $scope.updateFormReset(file);
    } else {
      file.showUpdating = true;

      $http.put('../../files/', updateData).success(function(error, res) {
        console.log(res);
        file.showUpdating = false;
        file.updated = true;
      })
    }


  }
})


app.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});
