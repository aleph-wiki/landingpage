{
  description = "Aleph.wiki MCP Server";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs = inputs @ { flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];

      perSystem = { config, self', inputs', pkgs, system, ... }: {
        packages.default = pkgs.stdenv.mkDerivation {
          pname = "aleph-wiki-mcp-server";
          version = "0.1.0";

          src = ./.;

          nativeBuildInputs = [ pkgs.bun ];

          buildPhase = ''
            # Install dependencies
            bun install --frozen-lockfile

            # Build TypeScript
            bun build src/index.ts --outdir dist --target node
          '';

          installPhase = ''
            mkdir -p $out/bin $out/lib
            cp -r dist/* $out/lib/
            cp -r node_modules $out/lib/

            # Create wrapper script
            cat > $out/bin/aleph-wiki-mcp-server <<EOF
            #!${pkgs.bash}/bin/bash
            exec ${pkgs.bun}/bin/bun $out/lib/index.js "\$@"
            EOF
            chmod +x $out/bin/aleph-wiki-mcp-server
          '';
        };

        devShells.default = pkgs.mkShell {
          buildInputs = [ pkgs.bun ];
        };
      };
    };
}
