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
