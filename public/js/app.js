var app = angular.module('eisBoxToolsApp', []);

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

app.controller('BoxController', function($scope, $http, $location) {
  $scope.box = {}
  $scope.loading = true;

  var boxID = $location.absUrl().split('/').pop();

  $http.get("../boxlist/" + boxID).success(function(res) {
    $scope.box = res[0];
    $scope.loading = false;
  })
})


app.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});
