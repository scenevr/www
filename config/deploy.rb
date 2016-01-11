# config valid only for Capistrano 3.1
lock '3.4.0'

set :application, 'scene-www'
set :repo_url, 'git@github.com:scenevr/www.git'

# Default branch is :master
# ask :branch, proc { `git rev-parse --abbrev-ref HEAD`.chomp }.call

# Default deploy_to directory is /var/www/my_app
set :deploy_to, '/home/ben/www'

# Default value for :scm is :git
# set :scm, :git

# Default value for :format is :pretty
# set :format, :pretty

# Default value for :log_level is :debug
# set :log_level, :debug

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
# set :linked_files, %w{config/database.yml}

# Default value for linked_dirs is []
# set :linked_dirs, %w{bin log tmp/pids tmp/cache tmp/sockets vendor/bundle public/system}

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for keep_releases is 5
# set :keep_releases, 5

namespace :deploy do

  before :starting, :run_tests_and_update

  task :run_tests_and_update do
    system "npm install --save scene-client"
    system "git commit package.json -m 'Bump scene-client'"
    system "git push"
    
    unless system "npm test"
      puts "Tests failed."
      exit
    end
  end

  before :starting, :stop_forever

  task :stop_forever do
    on roles(:app), in: :sequence, wait: 5 do
      execute "forever stop /home/ben/www/current/server.js; true"
    end
  end

  before :published, :start_forever

  task :start_forever do
    on roles(:app), in: :sequence, wait: 5 do
      execute "cd #{release_path}; npm install"
      execute "NODE_ENV=production forever --workingDir /home/ben/www/current start /home/ben/www/current/server.js"
    end
  end
end
