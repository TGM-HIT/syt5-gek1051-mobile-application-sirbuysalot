package at.tgm.sirbuysalot.repository;

import at.tgm.sirbuysalot.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
}
