package at.tgm.sirbuysalot.exception;

public class ConflictException extends RuntimeException {

    private final int serverVersion;
    private final int clientVersion;

    public ConflictException(String entity, int serverVersion, int clientVersion) {
        super(String.format("Konflikt bei %s: Server-Version %d, Client-Version %d",
                entity, serverVersion, clientVersion));
        this.serverVersion = serverVersion;
        this.clientVersion = clientVersion;
    }

    public int getServerVersion() {
        return serverVersion;
    }

    public int getClientVersion() {
        return clientVersion;
    }
}
